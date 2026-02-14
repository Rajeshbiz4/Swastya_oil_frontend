import React from "react";

interface LogoTitleProps {
  logo: string;
  title?: string;
  direction?: "row" | "column";
  width?: string;
}

const LogoTitle = ({ logo = "", title = "", direction = "row" , width = "200px"}: LogoTitleProps) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: direction,
        alignItems: "center",
        gap: "10px",
      }}
    >
      <img
        src={logo}
        alt="logo"
        style={{ width: width, height: "100px", objectFit: "contain" }}
      />
      <h2 style={{ margin: 0 , fontSize: "40px", fontWeight: "bold"}}>{title}</h2>
    </div>
  );
};

export default LogoTitle;
