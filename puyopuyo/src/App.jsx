import React, { useState, useEffect } from "react";
import "./App.css";

const ROWS = 12;
const COLS = 6;
const COLORS = ["red", "green", "blue", "yellow"];

// ランダムな色を返す
function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

// 形の定義
const SHAPES = {
  pair: [
    { row: 0, col: 0 },
    { row: -1, col: 0 },
  ],
  piech: [
    { row: -4, col: 0 },
    { row: -3, col: -1 },
    { row: -3, col: 0 },
    { row: -3, col: 1 },
    { row: -2, col: -2 },
    { row: -2, col: -1 },
    { row: -2, col: 0 },
    { row: -2, col: 1 },
    { row: -2, col: 2 },
    { row: -1, col: -1 },
    { row: -1, col: 1 },
    { row: 0, col: -2 },
    { row: 0, col: 2 },
  ],
};

// 新しいブロックを生成
function createBlock() {
  const shapeKey = Math.random() < 0.95 ? "pair" : "piech";
  const shape = SHAPES[shapeKey];
  const pivotCol = Math.floor(COLS / 2);

  return {
    cells: shape.map((c) => ({
      row: c.row,
      col: pivotCol + c.col,
      color: randomColor(), // 各セルごとに色をランダム
    })),
  };
}

// 安全なセル参照
function isEmpty(board, row, col) {
  if (col < 0 || col >= COLS) return false;
  if (row < 0) return true;
  if (row >= ROWS) return false;
  return !board[row][col];
}

// 重力
function applyGravity(board) {
  const newBoard = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  for (let c = 0; c < COLS; c++) {
    let pointer = ROWS - 1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r][c]) {
        newBoard[pointer][c] = board[r][c];
        pointer--;
      }
    }
  }
  return newBoard;
}

// 4つ以上つながったグループを探す
function findGroups(board) {
  const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  const groups = [];
  const directions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  function dfs(r, c, color, cells) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
    if (visited[r][c]) return;
    if (board[r][c] !== color) return;

    visited[r][c] = true;
    cells.push([r, c]);
    for (let [dr, dc] of directions) {
      dfs(r + dr, c + dc, color, cells);
    }
  }

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!visited[r][c] && board[r][c]) {
        const cells = [];
        dfs(r, c, board[r][c], cells);
        if (cells.length >= 4) {
          groups.push(...cells);
        }
      }
    }
  }
  return groups;
}

function App() {
  const [board, setBoard] = useState(
    Array.from({ length: ROWS }, () => Array(COLS).fill(null))
  );
  const [block, setBlock] = useState(createBlock());
  const [isResolving, setIsResolving] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // 自動落下処理
  useEffect(() => {
    if (isResolving || gameOver) return;

    const interval = setInterval(() => {
      setBlock((prev) => {
        if (!prev) return prev;

        const canMoveDown = prev.cells.every(
          (c) => c.row < ROWS - 1 && isEmpty(board, c.row + 1, c.col)
        );

        if (!canMoveDown) {
          // 盤面に追加
          const newBoard = board.map((r) => [...r]);
          prev.cells.forEach((c) => {
            if (c.row >= 0 && c.row < ROWS && c.col >= 0 && c.col < COLS) {
              newBoard[c.row][c.col] = c.color;
            }
          });
          const dropped = applyGravity(newBoard);
          setBoard(dropped);
          setTimeout(() => checkAndClear(dropped), 200);

          // 新しいブロックを生成してゲームオーバー判定
          const newBlock = createBlock();
          const isGameOver = newBlock.cells.some(
            (c) => c.row >= 0 && !isEmpty(dropped, c.row, c.col)
          );
          if (isGameOver) {
            setGameOver(true);
            return prev; // 新しいブロックは生成せず止める
          }

          return newBlock;
        }

        return { cells: prev.cells.map((c) => ({ ...c, row: c.row + 1 })) };
      });
    }, 500);

    return () => clearInterval(interval);
  }, [board, isResolving, gameOver]);

  // キー操作
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isResolving || gameOver) return;
      const key = e.key.toLowerCase();

      if (key === "arrowleft" || key === "a") {
        setBlock((prev) => {
          if (!prev) return prev;
          if (
            prev.cells.every(
              (c) => c.col > 0 && isEmpty(board, c.row, c.col - 1)
            )
          ) {
            return { cells: prev.cells.map((c) => ({ ...c, col: c.col - 1 })) };
          }
          return prev;
        });
      } else if (key === "arrowright" || key === "d") {
        setBlock((prev) => {
          if (!prev) return prev;
          if (
            prev.cells.every(
              (c) => c.col < COLS - 1 && isEmpty(board, c.row, c.col + 1)
            )
          ) {
            return { cells: prev.cells.map((c) => ({ ...c, col: c.col + 1 })) };
          }
          return prev;
        });
      } else if (key === "arrowdown" || key === "s") {
        setBlock((prev) => {
          if (!prev) return prev;
          let newCells = prev.cells.map((c) => ({ ...c }));
          while (
            newCells.every(
              (c) => c.row < ROWS - 1 && isEmpty(board, c.row + 1, c.col)
            )
          ) {
            newCells = newCells.map((c) => ({ ...c, row: c.row + 1 }));
          }
          return { cells: newCells };
        });
      } else if (key === "e") {
        rotateBlock(true);
      } else if (key === "q") {
        rotateBlock(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [board, isResolving, gameOver]);

  const rotateBlock = (clockwise = true) => {
    setBlock((prev) => {
      if (!prev) return prev;
      const pivot = prev.cells[0];
      const rotated = prev.cells.map((c) => {
        const dx = c.col - pivot.col;
        const dy = c.row - pivot.row;
        const newRow = clockwise ? pivot.row - dx : pivot.row + dx;
        const newCol = clockwise ? pivot.col + dy : pivot.col - dy;
        return { row: newRow, col: newCol, color: c.color };
      });

      if (
        rotated.every(
          (c) =>
            c.col >= 0 &&
            c.col < COLS &&
            (c.row < 0 || isEmpty(board, c.row, c.col))
        )
      ) {
        return { cells: rotated };
      }
      return prev;
    });
  };

  function checkAndClear(currentBoard) {
    setIsResolving(true);
    const toClear = findGroups(currentBoard);
    if (toClear.length === 0) {
      setIsResolving(false);
      return;
    }

    const newBoard = currentBoard.map((row) => [...row]);
    toClear.forEach(([r, c]) => {
      newBoard[r][c] = null;
    });

    setTimeout(() => {
      const dropped = applyGravity(newBoard);
      setBoard(dropped);
      setTimeout(() => checkAndClear(dropped), 300);
    }, 300);
  }

  const retryGame = () => {
    setBoard(Array.from({ length: ROWS }, () => Array(COLS).fill(null)));
    setBlock(createBlock());
    setGameOver(false);
    setIsResolving(false);
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {gameOver && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: COLS * 30,
            height: ROWS * 30,
            backgroundColor: "rgba(0,0,0,0.7)",
            color: "white",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "24px",
            zIndex: 10,
          }}
        >
          <div>GAME OVER</div>
          <button
            onClick={retryGame}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            RETRY
          </button>
        </div>
      )}
      <div className="board">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="row" style={{ display: "flex" }}>
            {row.map((cell, colIndex) => {
              const isBlock = block.cells.some(
                (c) => c.row === rowIndex && c.col === colIndex && !isResolving
              );
              const blockCell = block.cells.find(
                (c) => c.row === rowIndex && c.col === colIndex
              );
              const color = isBlock ? blockCell.color : cell;
              return (
                <div
                  key={colIndex}
                  className="cell"
                  style={{
                    backgroundColor: color ? color : "white",
                    border: "1px solid #ccc",
                    width: "30px",
                    height: "30px",
                  }}
                ></div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
