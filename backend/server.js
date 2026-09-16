const express = require('express');
const cors = require('cors');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const app = express();
const PORT = process.env.PORT || 4000;
const dataDirectory = path.join(__dirname, 'data');
const dataFile = path.join(dataDirectory, 'tasks.json');

app.use(cors());
app.use(express.json());

function readTasks() {
  fs.mkdirSync(dataDirectory, { recursive: true });
  if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify({ tasks: [] }, null, 2));
  return JSON.parse(fs.readFileSync(dataFile, 'utf8')).tasks;
}
function writeTasks(tasks) { fs.writeFileSync(dataFile, JSON.stringify({ tasks }, null, 2)); }

app.get('/api/health', (request, response) => response.json({ status: 'ok' }));
app.get('/api/tasks', (request, response) => response.json({ tasks: readTasks() }));
app.post('/api/tasks', (request, response) => {
  const { title, notes = '', priority = 'medium', dueDate = '' } = request.body;
  if (!title || !title.trim()) return response.status(400).json({ error: 'A task title is required.' });
  const now = new Date().toISOString();
  const task = { id: crypto.randomUUID(), title: title.trim(), notes: notes.trim(), priority, dueDate, completed: false, createdAt: now, updatedAt: now };
  const tasks = readTasks(); tasks.unshift(task); writeTasks(tasks);
  response.status(201).json({ task });
});
app.patch('/api/tasks/:id', (request, response) => {
  const tasks = readTasks(); const task = tasks.find((item) => item.id === request.params.id);
  if (!task) return response.status(404).json({ error: 'Task not found.' });
  const { title, notes, priority, dueDate, completed } = request.body;
  if (typeof title === 'string' && title.trim()) task.title = title.trim();
  if (typeof notes === 'string') task.notes = notes.trim();
  if (['low', 'medium', 'high'].includes(priority)) task.priority = priority;
  if (typeof dueDate === 'string') task.dueDate = dueDate;
  if (typeof completed === 'boolean') task.completed = completed;
  task.updatedAt = new Date().toISOString(); writeTasks(tasks);
  response.json({ task });
});
app.delete('/api/tasks/:id', (request, response) => {
  const tasks = readTasks(); const nextTasks = tasks.filter((task) => task.id !== request.params.id);
  if (nextTasks.length === tasks.length) return response.status(404).json({ error: 'Task not found.' });
  writeTasks(nextTasks); response.json({ success: true });
});

app.listen(PORT, () => console.log(`Backend API running at http://localhost:${PORT}`));
