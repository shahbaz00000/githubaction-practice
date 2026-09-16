import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, Circle, Plus, Search, Trash2, X } from 'lucide-react';

const emptyForm = { title: '', notes: '', priority: 'medium', dueDate: '' };

async function request(url, options = {}) {
  const response = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function App() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [isPanelOpen, setPanelOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const loadTasks = async () => setTasks((await request('/api/tasks')).tasks);
  useEffect(() => { loadTasks().catch((loadError) => setError(loadError.message)); }, []);

  const visibleTasks = useMemo(() => tasks.filter((task) => {
    const statusMatch = filter === 'all' || (filter === 'done' ? task.completed : !task.completed);
    const searchMatch = `${task.title} ${task.notes}`.toLowerCase().includes(search.toLowerCase());
    return statusMatch && searchMatch;
  }), [tasks, filter, search]);

  const completedCount = tasks.filter((task) => task.completed).length;
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;

  async function createTask(event) {
    event.preventDefault();
    if (!form.title.trim()) return setError('Give your task a title first.');
    try { await request('/api/tasks', { method: 'POST', body: JSON.stringify(form) }); setForm(emptyForm); setPanelOpen(false); setError(''); await loadTasks(); }
    catch (createError) { setError(createError.message); }
  }
  async function toggleTask(task) { await request(`/api/tasks/${task.id}`, { method: 'PATCH', body: JSON.stringify({ completed: !task.completed }) }); await loadTasks(); }
  async function deleteTask(task) { await request(`/api/tasks/${task.id}`, { method: 'DELETE' }); await loadTasks(); }

  return <main className="app-shell">
    <header className="topbar"><a className="brand" href="/"><span className="brand-mark">✳</span>daymark</a><span className="date-stamp">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span></header>
    <section className="intro"><div><p className="eyebrow">Your working rhythm</p><h1>Make room for<br /><em>the important.</em></h1></div><p className="intro-copy">A calm place for the things<br className="desktop-break" /> you want to move forward.</p></section>
    <section className="stats"><div className="stat"><strong>{tasks.length - completedCount}</strong><span>open tasks</span></div><div className="stat"><strong>{completedCount}</strong><span>completed</span></div><div className="stat progress-stat"><div className="progress-track"><span style={{ width: `${progress}%` }} /></div><span>{progress}% in motion</span></div></section>
    <section className="workspace"><div className="workspace-heading"><div><p className="eyebrow">Today’s board</p><h2>Tasks</h2></div><button className="primary-button" onClick={() => setPanelOpen(true)}><Plus size={17} /> New task</button></div>
      <div className="controls"><label className="search-box"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks" /></label><div className="filter-group">{[['all', 'All'], ['open', 'Open'], ['done', 'Done']].map(([value, label]) => <button className={filter === value ? 'filter-button active' : 'filter-button'} key={value} onClick={() => setFilter(value)}>{label}</button>)}</div></div>
      <div className="task-list">{visibleTasks.length ? visibleTasks.map((task) => <article className={task.completed ? 'task-card completed' : 'task-card'} key={task.id}><button className="check-button" onClick={() => toggleTask(task)} aria-label={`Mark ${task.title} ${task.completed ? 'open' : 'complete'}`}>{task.completed ? <Check size={14} /> : <Circle size={19} />}</button><div className="task-main"><div className="task-title">{task.title}</div>{task.notes && <div className="task-notes">{task.notes}</div>}</div><span className={`priority priority-${task.priority}`}>{task.priority}</span><span className="due-date">{task.dueDate ? <><CalendarDays size={13} />{new Date(`${task.dueDate}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</> : ''}</span><button className="delete-button" onClick={() => deleteTask(task)} aria-label={`Delete ${task.title}`}><Trash2 size={16} /></button></article>) : <div className="empty-state"><strong>No tasks here yet.</strong><span>Make a little room for what matters next.</span></div>}</div>
    </section>
    {isPanelOpen && <aside className="task-panel"><button className="panel-backdrop" onClick={() => setPanelOpen(false)} aria-label="Close form" /><div className="panel-content"><button className="close-button" onClick={() => setPanelOpen(false)} aria-label="Close"><X /></button><p className="eyebrow">Add to your board</p><h2>New task</h2><form onSubmit={createTask}><label>Task title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="What needs your attention?" autoFocus /></label><label>Notes <span className="optional">Optional</span><textarea rows="4" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="A little context goes a long way..." /></label><div className="form-row"><label>Priority<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label><label>Due date<input type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} /></label></div><button className="primary-button wide">Create task <span>→</span></button>{error && <p className="form-error">{error}</p>}</form></div></aside>}
  </main>;
}
export default App;
