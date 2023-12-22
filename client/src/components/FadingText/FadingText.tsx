import React, { useState, useEffect } from 'react';
import './FadingText.css'; // Create a CSS file for styling

type Properties = {
    text: string,
    sender: string
};

const FadingText = ({ sender, text }: Properties) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            setVisible(false);

            setTimeout(() => {
                const element = document.getElementById('fading-text');
                if (element) {
                    element.remove();
                }
            }, 1000);
        }, 5000); // Set the duration in milliseconds (5 seconds in this example)
    }, []);

    return (
        <div id="fading-text"
             className={`fading-text ${visible ? 'visible' : 'hidden'}`}>
            <span style={{
                color: "#2866a8",
                fontSize: "15px",
            }}>
               {sender}
            </span>
            <div style={{width: '10px'}}></div>
            <span style={{
                color: "white",
                fontSize: "15px",
            }}>
                {text}
            </span>
        </div>
    );
};

export default FadingText;
