import React from "react";
import "./index.css";

export default function DeleteButton({ onClick }) {
    return (
        <button 
            className="Btn2 flex items-center gap-2" 
            onClick={onClick}
        >
            Delete
            <svg 
                className="svg2" 
                viewBox="0 0 448 512" 
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M135.2 17.7C140.6 7.2 151.7 0 164 0h120c12.3 0 
                    23.4 7.2 28.8 17.7L328 32h88c13.3 0 24 10.7 24 
                    24s-10.7 24-24 24h-8l-21.2 371c-1.4 24.5-21.7 
                    43-46.3 43H107.5c-24.6 0-44.9-18.5-46.3-43L40 
                    80h-8C18.7 80 8 69.3 8 56s10.7-24 24-24h88l15.2-14.3zM224 
                    160c13.3 0 24 10.7 24 24v224c0 13.3-10.7 24-24 
                    24s-24-10.7-24-24V184c0-13.3 10.7-24 24-24zm96 
                    0c13.3 0 24 10.7 24 24v224c0 13.3-10.7 24-24 
                    24s-24-10.7-24-24V184c0-13.3 10.7-24 24-24zm-192 
                    0c13.3 0 24 10.7 24 24v224c0 13.3-10.7 24-24 
                    24s-24-10.7-24-24V184c0-13.3 10.7-24 24-24z"
                />
            </svg>
        </button>
    );
}
