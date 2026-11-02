import { useEffect, useState } from "react";
 
export default function App() {
  const [msg, setMsg] = useState("Đang gọi API...");
  useEffect(() => {
    fetch("http://localhost:8080/api/hello")
      .then((res) => res.json())
      .then((data) => setMsg(data.message))
      .catch(() => setMsg("Không gọi được backend"));
  }, []);
  return <h1>{msg}</h1>;
}
