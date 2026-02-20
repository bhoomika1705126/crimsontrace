import pandas as pd

def sliding_window_distinct(transactions, time_col='timestamp', group_col='counterparty', window_hours=72, threshold=10):
    if len(transactions) < threshold:
        return False
    times = transactions[time_col].values
    counterparties = transactions[group_col].values
    n = len(times)
    left = 0
    counter = {}
    distinct_count = 0
    for right in range(n):
        cp = counterparties[right]
        if cp not in counter:
            counter[cp] = 0
        if counter[cp] == 0:
            distinct_count += 1
        counter[cp] += 1
        while (times[right] - times[left]) > pd.Timedelta(hours=window_hours):
            cp_left = counterparties[left]
            counter[cp_left] -= 1
            if counter[cp_left] == 0:
                distinct_count -= 1
            left += 1
        if distinct_count >= threshold:
            return True
    return False

def flag_rapid_movement(df, minutes=10):
    rapid = {}
    for acc in set(df['sender_id']).union(set(df['receiver_id'])):
        sends = df[df['sender_id'] == acc][['timestamp', 'amount']].sort_values('timestamp')
        receives = df[df['receiver_id'] == acc][['timestamp', 'amount']].sort_values('timestamp')
        for _, send in sends.iterrows():
            recent_receives = receives[(receives['timestamp'] >= send['timestamp'] - pd.Timedelta(minutes=minutes)) &
                                       (receives['timestamp'] <= send['timestamp'])]
            if not recent_receives.empty:
                rapid.setdefault(acc, []).append("rapid_movement")
                break
    return rapid
