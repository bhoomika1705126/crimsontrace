import networkx as nx
import pandas as pd
from app.utils.helpers import sliding_window_distinct

def detect_cycles(G, max_length=5):
    cycles = []
    for cycle in nx.simple_cycles(G):
        if 3 <= len(cycle) <= max_length:
            cycles.append(cycle)
    return cycles

def detect_fan_in_out(df, window_hours=72):
    suspicious = {}
    for receiver, group in df.groupby('receiver_id'):
        group_sorted = group.sort_values('timestamp')
        if sliding_window_distinct(group_sorted, group_col='sender_id', window_hours=window_hours):
            suspicious.setdefault(receiver, []).append('fan_in')
    for sender, group in df.groupby('sender_id'):
        group_sorted = group.sort_values('timestamp')
        if sliding_window_distinct(group_sorted, group_col='receiver_id', window_hours=window_hours):
            suspicious.setdefault(sender, []).append('fan_out')
    return suspicious

def detect_layered_shells(G, max_chain_length=5, intermediate_degree_threshold=3):
    chains = []
    def dfs(current, path, depth):
        if depth > max_chain_length:
            return
        if len(path) >= 3:
            intermediate = path[1:-1]
            if all(G.degree(node) <= intermediate_degree_threshold for node in intermediate):
                chains.append(path.copy())
        for neighbor in G.successors(current):
            if neighbor not in path:
                path.append(neighbor)
                dfs(neighbor, path, depth+1)
                path.pop()
    for node in G.nodes:
        dfs(node, [node], 1)
    return chains

def find_two_hop_exposed(G, suspicious_set):
    exposed = {}
    for acc in suspicious_set:
        for node, dist in nx.single_source_shortest_path_length(G, acc, cutoff=2).items():
            if node != acc and node not in suspicious_set:
                exposed[node] = "two_hop_exposure"
    return exposed
