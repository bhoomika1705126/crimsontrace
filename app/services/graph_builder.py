import pandas as pd
import networkx as nx
from io import StringIO
from typing import Tuple

def build_graph_from_csv(csv_content: str) -> Tuple[nx.DiGraph, pd.DataFrame]:
    df = pd.read_csv(StringIO(csv_content), parse_dates=['timestamp'])
    required = ['transaction_id', 'sender_id', 'receiver_id', 'amount', 'timestamp']
    if not all(col in df.columns for col in required):
        raise ValueError("CSV missing required columns")
    G = nx.DiGraph()
    for _, row in df.iterrows():
        G.add_edge(row['sender_id'], row['receiver_id'],
                   transaction_id=row['transaction_id'],
                   amount=row['amount'],
                   timestamp=row['timestamp'])
    return G, df
