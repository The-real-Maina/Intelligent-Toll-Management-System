import React, { useState, useEffect } from "react";
import axios from "axios";

const AIChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [userRole, setUserRole] = useState("Driver");
  const [userName, setUserName] = useState("Guest");

  useEffect(() => {
    try {
      // 1. Get the exact key we saw in your screenshot: "itms_user"
      const storedUserString = localStorage.getItem("itms_user");
      
      if (storedUserString) {
        // 2. Parse the JSON string into an object
        const storedUser = JSON.parse(storedUserString);
        
        // 3. Extract the role and name
        // Your screenshot showed "full_name" in the JSON
        const role = storedUser.role || "Driver";
        const name = storedUser.full_name || storedUser.name || "User";
        
        setUserRole(role);
        setUserName(name);
        
        // 4. Set the dynamic greeting
        setMessages([
          { sender: "ai", text: `Welcome back, ${name}! You are logged in as a ${role}. How can I assist you today?` }
        ]);
      } else {
        // Fallback if no user is found (e.g., they are not logged in)
        setMessages([
          { sender: "ai", text: `Hello! I am your ITMS AI assistant. Please log in for a personalized experience.` }
        ]);
      }
    } catch (error) {
      console.error("Error reading user from localStorage:", error);
      setMessages([
        { sender: "ai", text: `Hello! How can I help you today?` }
      ]);
    }
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await axios.post("http://localhost:5000/api/ai/chat", {
        message: input,
        user_name: userName,
        role: userRole
      });

      const aiMessage = { sender: "ai", text: response.data.reply };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Sorry, I am having trouble connecting right now." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 1000 }}>
      {isOpen && (
        <div style={{ width: "350px", height: "450px", backgroundColor: "white", borderRadius: "10px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", marginBottom: "10px" }}>
          
          <div style={{ backgroundColor: "#007bff", color: "white", padding: "15px", borderTopLeftRadius: "10px", borderTopRightRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: "16px" }}>ITMS Support</h3>
            <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontSize: "18px" }}>✖</button>
          </div>

          <div style={{ flex: 1, padding: "15px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", backgroundColor: "#f8f9fa" }}>
            {messages.map((msg, index) => (
              <div key={index} style={{ alignSelf: msg.sender === "user" ? "flex-end" : "flex-start", backgroundColor: msg.sender === "user" ? "#007bff" : "#e9ecef", color: msg.sender === "user" ? "white" : "black", padding: "10px 15px", borderRadius: "15px", maxWidth: "80%", fontSize: "14px" }}>
                {msg.text}
              </div>
            ))}
            {isLoading && <div style={{ alignSelf: "flex-start", color: "gray", fontSize: "12px" }}>AI is typing...</div>}
          </div>

          <form onSubmit={sendMessage} style={{ display: "flex", padding: "10px", borderTop: "1px solid #ddd" }}>
            <input 
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder="Ask about toll fees, M-Pesa..." 
              style={{ flex: 1, padding: "10px", border: "1px solid #ccc", borderRadius: "20px", outline: "none" }}
            />
            <button type="submit" style={{ marginLeft: "10px", padding: "10px 15px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "20px", cursor: "pointer" }}>Send</button>
          </form>
        </div>
      )}

      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)} 
          style={{ width: "60px", height: "60px", borderRadius: "50%", backgroundColor: "#007bff", color: "white", border: "none", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.2)", fontSize: "24px" }}
        >
          💬
        </button>
      )}
    </div>
  );
};

export default AIChatWidget;