import React, { useState } from "react";
import { createProject, createTask, getTasks } from "./api";

function Dashboard() {
  const [projectName, setProjectName] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [userId, setUserId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [tasks, setTasks] = useState([]);

  const handleProject = async () => {
    await createProject({ name: projectName });
    alert("Project created");
  };

  const handleTask = async () => {
    await createTask({
      title: taskTitle,
      project: projectId,
      assigned_to: userId,
      due_date: dueDate,
    });
    alert("Task created");
  };

  const loadTasks = async () => {
    const data = await getTasks();
    setTasks(data);
  };

  return (
    <div>
      <h2>Dashboard</h2>

      <h3>Create Project</h3>
      <input placeholder="Project Name" onChange={e => setProjectName(e.target.value)} />
      <button onClick={handleProject}>Create</button>

      <h3>Create Task</h3>
      <input placeholder="Task Title" onChange={e => setTaskTitle(e.target.value)} />
      <input placeholder="Project ID" onChange={e => setProjectId(e.target.value)} />
      <input placeholder="User ID" onChange={e => setUserId(e.target.value)} />
      <input type="date" onChange={e => setDueDate(e.target.value)} />
      <button onClick={handleTask}>Create Task</button>

      <h3>Tasks</h3>
      <button onClick={loadTasks}>Load Tasks</button>

      <ul>
        {tasks.map(task => (
          <li key={task.id}>
            {task.title} - {task.status}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Dashboard;