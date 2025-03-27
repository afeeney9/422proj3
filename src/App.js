import React, { useState } from "react";
import { LoginPage } from "./LoginPage";
// import { HomePage } from "./HomePage";
// import { UploadPage } from "./UploadPage";

export default function App() {
    const [user, setUser] = useState(null);
    const [viewer, setViewer] = useState(0);


    return (
        <div>
            {viewer === 0 && <LoginPage setUser={setUser} setViewer={setViewer} />}
            {/*{viewer === 1 && <HomePage username={user} setViewer={setViewer} />}*/}
            {/*{viewer === 2 && <UploadPage username={user} setViewer={setViewer} />}*/}
        </div>
    );
};
