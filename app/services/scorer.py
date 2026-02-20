import networkx as nx

def is_merchant(G, node):
    return G.in_degree(node) > 50 and G.out_degree(node) == 0

def calculate_final_score(node, graph_score, gnn_score, G, ml_score=0.0):
    if is_merchant(G, node):
        return 5.0, ["merchant_activity"]
    final = (0.4 * graph_score) + (0.3 * ml_score) + (0.3 * gnn_score)
    return round(final * 100, 2), []
