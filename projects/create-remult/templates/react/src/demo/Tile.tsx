import React from "react";

export type TileStatus = "Success" | "Error" | "Warning" | "Info" | "Loading";

interface TileProps {
  title: string;
  status?: TileStatus;
  subtitle: string;
  width?: "full" | "half" | "third" | "fourth"; // Added width prop
  children?: React.ReactNode; // Added to allow for external content
  icon?: string; // Added to allow for an icon
  className?: string; // Added to allow for custom styling
}

const Tile: React.FC<TileProps> = ({
  title,
  subtitle,
  status,
  width = "full",
  children,
  icon,
  className = "",
}) => {
  return (
    <div className={`tile ${status?.toLowerCase()} ${width} ${className}`}>
      <div className="tile__header">
        <h3 className="tile__title">{title}</h3>
        <div className="tile__subtitle">{subtitle}</div>
        {icon ? (
          <img
            src={icon + ".svg"}
            alt={`${icon} icon`}
            className="tile__icon"
          />
        ) : (
          status && <div className="tile__status-indicator"></div>
        )}
      </div>
      {children}
    </div>
  );
};

export default Tile;
