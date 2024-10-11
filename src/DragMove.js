import React, { useEffect, useState } from "react";

export default function DragMove(props) {
  const {
    onPointerDown,
    onPointerUp,
    onPointerMove,
    onDragMove,
    children,
    style,
    className,
    isSvg = false
  } = props;

  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = (e) => {
    setIsDragging(true);

    onPointerDown(e);
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);

    onPointerUp(e);
  };

  const handlePointerMove = (e) => {
    if (isDragging) onDragMove(e);

    onPointerMove(e);
  };

  useEffect(() => {
    window.addEventListener("mouseup", handlePointerUp);

    return () => {
      window.removeEventListener("mouseup", handlePointerUp);
    };
  }, []);

  // Dynamically render a <g> or <div> tag
  const Tag = isSvg ? "g" : "div";

  return (
    <Tag
      onPointerDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      style={style}
      className={className}
    >
      {children}
    </Tag>
  );
}

DragMove.defaultProps = {
  onPointerDown: () => {},
  onPointerUp: () => {},
  onPointerMove: () => {}
};
