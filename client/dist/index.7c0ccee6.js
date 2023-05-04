const p = document.querySelector("button");
const prompt = "Hello world";
p.innerText = prompt;
const handleClick = async ()=>{
    const response = await fetch("http://localhost:8000", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            prompt: prompt
        })
    });
    if (response.ok) {
        const data = await response.json();
        p.innerText = data.message;
    }
};
p.addEventListener("click", ()=>handleClick);
window.addEventListener("DOMContentLoaded", ()=>figlet("fuck"));

//# sourceMappingURL=index.7c0ccee6.js.map
