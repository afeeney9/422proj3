import React, { useState } from "react";
import axios from 'axios';

export const LoginPage = ({ setViewer, setUser }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState(<div></div>);

    async function handleSubmit(e){
        e.preventDefault(); // Prevents page reload

        if(username && password){
            setErrorMessage(<div></div>)
            try {
                console.log("attempting to connect");
                const response = await axios.post(
                    'http://localhost:5000/api/login',
                    { username, password },
                    { headers: { 'Content-Type': 'application/json' } });
                if(response.data.success){
                    setUser(username); // Updates the user state
                    setViewer(1); // Redirects to HomePage (assuming viewer=1 is home)
                }
                else{
                    setErrorMessage(<div>Incorrect username or password</div>)
                }
                console.log(response.data.success ? 'Login successful!' : 'Invalid credentials');

            } catch (error) {
                console.log('Error connecting to backend');
            }
        }
        else{
            setErrorMessage(<div>Please enter both a username and password</div>)
        }
    }


    return (
        <div style={styles.container}>
            <h2>Login</h2>
            <form onSubmit={async () => await handleSubmit()} style={styles.form}>
                <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={styles.input}
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={styles.input}
                />
                <button type="submit" style={styles.button}>Login</button>
                {errorMessage}
            </form>
        </div>
    );
};

// Inline Styles
const styles = {
    container: {
        fontFamily: "Arial",
        textAlign: "center",
        marginTop: 100,
    },
    form: {
        display: "inline-block",
        background: "#f4f4f4",
        padding: 20,
        borderRadius: 8,
    },
    input: {
        display: "block",
        margin: 10,
        padding: 10,
        width: 200,
    },
    button: {
        background: "#007bff",
        color: "white",
        padding: "10px 20px",
        border: "none",
        cursor: "pointer",
    },
};

export default LoginPage;
