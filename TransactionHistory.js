import React from "react";
import "./transactionhistory.css";

export default function TransactionHistory({ events = []}) {
  return (
    <aside className="tx-history-box">
      <h3>Transaction History</h3>
      {events.length === 0 ? (
        <p className="no-activity">No recent activity</p>
      ) : (
        <ul className="tx-list">
          {events.map((e, i) => (
            <li key={i}>
              <strong>{e.event}</strong> &mdash;{" "}
              {e.transactionHash.slice(0, 8)}… (block {e.blockNumber})
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}