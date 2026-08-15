// components/AnimatedText.tsx
import React from "react";
import styles from "./AnimatedText.module.css";

interface AnimatedTextProps {
  text: string;
}

const AnimatedText: React.FC<AnimatedTextProps> = ({ text = "" }) => {
  return (
    <div className={styles.container} style={{fontFamily:"Kanit_B",fontSize:18,marginLeft:2}}>
      {text.split("").map((char, index) => (
        <span
          key={index}
          className={styles.bounce}
          style={{ animationDelay: `${index * 0.5}s` }}
        >
          {char}
        </span>
      ))}
    </div>
  );
};

export default AnimatedText;
