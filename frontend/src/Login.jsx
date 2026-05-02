import React, { useState } from "react";
import { login, signup } from "./api";

function Login({ setPage }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");

  const handleLogin = async () => {
    const data = await login({ username, password });
    if (data.access) {
      localStorage.setItem("token", data.access);
      setPage("dashboard");
    } else {
      alert("Login failed");
    }
  };

  const handleSignup = async () => {
    await signup({ username, password, role });
    alert("Signup success");
  };

  return (
    <div className="container">
      <h2>Login</h2>

      <input placeholder="Username" onChange={e => setUsername(e.target.value)} />
      <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />

      <button onClick={handleLogin}>Login</button>

      <h3>Signup</h3>

      <select onChange={e => setRole(e.target.value)}>
        <option value="admin">Admin</option>
        <option value="member">Member</option>
      </select>

      <button onClick={handleSignup}>Signup</button>
    </div>
  );
}

export default Login;