import torch
import torch.nn.functional as F
from torch_geometric.nn import GCNConv
from torch_geometric.utils import from_networkx
import networkx as nx
import numpy as np

class CrimsonGNN(torch.nn.Module):
    def __init__(self, num_features):
        super().__init__()
        self.conv1 = GCNConv(num_features, 16)
        self.conv2 = GCNConv(16, 1)

    def forward(self, x, edge_index):
        x = self.conv1(x, edge_index)
        x = F.relu(x)
        x = self.conv2(x, edge_index)
        return torch.sigmoid(x)

def extract_node_features(G):
    features = []
    pr = nx.pagerank(G)
    for node in G.nodes:
        feat = [
            G.degree(node),
            nx.clustering(G, node),
            pr.get(node, 0),
            G.in_degree(node),
            G.out_degree(node)
        ]
        features.append(feat)
    return np.array(features, dtype=np.float32)

def run_gnn_inference(G):
    if G.number_of_nodes() == 0:
        return {}
    x = extract_node_features(G)
    x = (x - x.mean(axis=0)) / (x.std(axis=0) + 1e-8)
    pyg_data = from_networkx(G)
    pyg_data.x = torch.tensor(x, dtype=torch.float)
    model = CrimsonGNN(num_features=x.shape[1])
    model.eval()
    with torch.no_grad():
        scores = model(pyg_data.x, pyg_data.edge_index).numpy().flatten()
    return {node: float(score) for node, score in zip(G.nodes, scores)}
