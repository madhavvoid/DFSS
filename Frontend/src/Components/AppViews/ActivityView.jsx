import { formatDate } from "../../utils/fileUtils";

function ActivityView({ items }) {
  return (
    <section className="app-view activity-view">
      <div className="view-heading"><div><span className="view-kicker">RECENT ACTIONS</span><h1>Activity</h1><p>Changes made during this signed-in session.</p></div></div>
      {items.length ? <ol className="activity-list">{items.map((item) => <li key={item.id}><span className="activity-marker" /><div><strong>{item.type}</strong><span>{item.name}</span></div><time>{formatDate(item.at)}</time></li>)}</ol> : <div className="nodes-message">There’s no activity in this session yet.</div>}
    </section>
  );
}

export default ActivityView;