import time
import traceback
import networkx as nx
from app.services.graph_builder import build_graph_from_csv
from app.services.detector import detect_cycles, detect_fan_in_out, detect_layered_shells, find_two_hop_exposed
# Temporarily comment out GNN import if it causes issues, but we'll keep it for now
from app.services.gnn_engine import run_gnn_inference  # not used anymore
from app.services.scorer import calculate_final_score
from app.utils.helpers import flag_rapid_movement
from app.models.schemas import AnalysisResponse, SuspiciousAccount, FraudRing, Summary

def analyze_csv(csv_content: str):
    print("=" * 50)
    print("Starting analyze_csv function (with dummy GNN scores)")
    start_time = time.time()

    try:
        # Step 1: Build graph
        print("Step 1: Building graph from CSV...")
        G, df = build_graph_from_csv(csv_content)
        total_accounts = G.number_of_nodes()
        print(f"Graph built: {total_accounts} nodes, {G.number_of_edges()} edges")

        # Step 2: Use dummy GNN scores (bypass actual GNN inference)
        print("Step 2: Using dummy GNN scores (0.5 for every node)...")
        gnn_scores = {node: 0.5 for node in G.nodes}
        print(f"Dummy scores generated for {len(gnn_scores)} nodes")

        # Step 3: Rule-based detection
        print("Step 3: Running rule-based detection...")
        cycles = detect_cycles(G)
        print(f"  - Cycles found: {len(cycles)}")
        fan_suspicious = detect_fan_in_out(df)
        print(f"  - Fan in/out accounts: {len(fan_suspicious)}")
        chains = detect_layered_shells(G)
        print(f"  - Layered shells found: {len(chains)}")
        velocity_flags = flag_rapid_movement(df)
        print(f"  - Velocity flags: {len(velocity_flags)}")

        prelim_suspicious = set()
        suspicious_dict = {}
        fraud_rings = []
        ring_counter = 1

        # Process cycles
        print("Step 4: Processing cycles...")
        for cycle in cycles:
            ring_id = f"RING_{ring_counter:03d}"
            ring_counter += 1
            members = list(cycle)
            for acc in members:
                prelim_suspicious.add(acc)
                graph_score = 0.5
                gnn_score_val = gnn_scores.get(acc, 0.5)
                patterns = [f"cycle_length_{len(cycle)}"]
                final_score, _ = calculate_final_score(acc, graph_score, gnn_score_val, G)
                suspicious_dict[acc] = {
                    "score": final_score,
                    "patterns": patterns,
                    "ring_id": ring_id
                }
            risk = sum(suspicious_dict[acc]["score"] for acc in members) / len(members)
            fraud_rings.append({
                "ring_id": ring_id,
                "member_accounts": members,
                "pattern_type": f"cycle_length_{len(cycle)}",
                "risk_score": round(risk, 2)
            })

        # Process fan-in/out
        print("Step 5: Processing fan-in/out...")
        for acc, patterns in fan_suspicious.items():
            prelim_suspicious.add(acc)
            graph_score = 0.3
            gnn_score_val = gnn_scores.get(acc, 0.5)
            if acc in suspicious_dict:
                suspicious_dict[acc]["patterns"] = list(set(suspicious_dict[acc]["patterns"] + patterns))
                final_score, _ = calculate_final_score(acc, graph_score, gnn_score_val, G)
                suspicious_dict[acc]["score"] = final_score
            else:
                ring_id = f"RING_{ring_counter:03d}"
                ring_counter += 1
                final_score, _ = calculate_final_score(acc, graph_score, gnn_score_val, G)
                suspicious_dict[acc] = {
                    "score": final_score,
                    "patterns": patterns,
                    "ring_id": ring_id
                }
                fraud_rings.append({
                    "ring_id": ring_id,
                    "member_accounts": [acc],
                    "pattern_type": patterns[0] if patterns else "fan_pattern",
                    "risk_score": round(final_score, 2)
                })

        # Process layered shells
        print("Step 6: Processing layered shells...")
        for chain in chains:
            members = list(chain)
            new_accs = [a for a in members if a not in suspicious_dict]
            if new_accs:
                ring_id = f"RING_{ring_counter:03d}"
                ring_counter += 1
                for acc in new_accs:
                    prelim_suspicious.add(acc)
                    graph_score = 0.4
                    gnn_score_val = gnn_scores.get(acc, 0.5)
                    final_score, _ = calculate_final_score(acc, graph_score, gnn_score_val, G)
                    suspicious_dict[acc] = {
                        "score": final_score,
                        "patterns": ["layered_shell"],
                        "ring_id": ring_id
                    }
                risk = sum(suspicious_dict[acc]["score"] for acc in members if acc in suspicious_dict) / len(members)
                fraud_rings.append({
                    "ring_id": ring_id,
                    "member_accounts": members,
                    "pattern_type": "layered_shell",
                    "risk_score": round(risk, 2)
                })

        # Multi-hop exposure
        print("Step 7: Multi-hop exposure...")
        two_hop = find_two_hop_exposed(G, prelim_suspicious)
        for acc, pattern in two_hop.items():
            if acc in suspicious_dict:
                suspicious_dict[acc]["patterns"].append(pattern)
            else:
                graph_score = 0.2
                gnn_score_val = gnn_scores.get(acc, 0.5)
                final_score, _ = calculate_final_score(acc, graph_score, gnn_score_val, G)
                ring_id = f"RING_{ring_counter:03d}"
                ring_counter += 1
                suspicious_dict[acc] = {
                    "score": final_score,
                    "patterns": [pattern],
                    "ring_id": ring_id
                }
                fraud_rings.append({
                    "ring_id": ring_id,
                    "member_accounts": [acc],
                    "pattern_type": pattern,
                    "risk_score": round(final_score, 2)
                })

        # Velocity flags
        print("Step 8: Velocity flags...")
        for acc, patterns in velocity_flags.items():
            if acc in suspicious_dict:
                for p in patterns:
                    if p not in suspicious_dict[acc]["patterns"]:
                        suspicious_dict[acc]["patterns"].append(p)
            else:
                graph_score = 0.1
                gnn_score_val = gnn_scores.get(acc, 0.5)
                final_score, _ = calculate_final_score(acc, graph_score, gnn_score_val, G)
                ring_id = f"RING_{ring_counter:03d}"
                ring_counter += 1
                suspicious_dict[acc] = {
                    "score": final_score,
                    "patterns": patterns,
                    "ring_id": ring_id
                }
                fraud_rings.append({
                    "ring_id": ring_id,
                    "member_accounts": [acc],
                    "pattern_type": patterns[0],
                    "risk_score": round(final_score, 2)
                })

        # Build final response
        print("Step 9: Building final response...")
        suspicious_accounts = [
            SuspiciousAccount(
                account_id=acc,
                suspicion_score=round(data["score"], 2),
                detected_patterns=data["patterns"],
                ring_id=data["ring_id"]
            )
            for acc, data in suspicious_dict.items()
        ]
        suspicious_accounts.sort(key=lambda x: x.suspicion_score, reverse=True)

        elapsed = time.time() - start_time
        summary = Summary(
            total_accounts_analyzed=total_accounts,
            suspicious_accounts_flagged=len(suspicious_accounts),
            fraud_rings_detected=len(fraud_rings),
            processing_time_seconds=round(elapsed, 2)
        )

        print(f"Analysis completed in {elapsed:.2f} seconds")
        print("=" * 50)
        return AnalysisResponse(
            suspicious_accounts=suspicious_accounts,
            fraud_rings=fraud_rings,
            summary=summary
        )

    except Exception as e:
        print("❌ ERROR in analyze_csv:")
        traceback.print_exc()
        raise