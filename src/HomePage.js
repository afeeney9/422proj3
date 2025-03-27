import React, { useState } from "react";
import axios from 'axios';

export const HomePage = ({ setViewer}) => {
    const [searchTerms, setSearchTerms] = useState(null);
    const [photos, setPhotos] = useState(<div></div>)

    async function handleSubmit(e){
        e.preventDefault(); // Prevents page reload

        if(searchTerms) {
        }
    }


    return (
        <div style={styles.container}>
            <h2>Photo Gallery</h2>
            <form onSubmit={async () => await handleSubmit()} style={styles.form}>
                <input
                    type="text"
                    name="search"
                    placeholder="Search"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={styles.input}
                />

                <button type="submit" style={styles.button}>Search</button>
            </form>
            <button onClick={() => setViewer(2)} type="button" style={styles.button}>Upload Photo</button>


            {photos}
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
