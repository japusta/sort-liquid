import UIController from './ui/UIController';

window.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('puzzleForm') as HTMLFormElement;
  const errorDiv = document.getElementById('errorMessage')!;
  const gameContainer = document.getElementById('game-container')!;
  const canvas = document.getElementById('canvas1') as HTMLCanvasElement;
  const movesContainer = document.getElementById('movesContainer')!;

  new UIController(form, errorDiv, gameContainer, canvas, movesContainer);
});
