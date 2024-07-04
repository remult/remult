<span class="loader"></span>

<style>
  .loader {
    color: #0066c8;
    font-family: Consolas, Menlo, Monaco, monospace;
    font-weight: bold;
    font-size: 16px;
    opacity: 0.8;
    margin-left: 3px;
  }
  .loader:before {
    content: '{';
    display: inline-block;
    animation: pulse 0.4s alternate infinite ease-in-out;
  }
  .loader:after {
    content: '}';
    display: inline-block;
    animation: pulse 0.4s 0.3s alternate infinite ease-in-out;
  }

  @keyframes pulse {
    to {
      transform: scale(0.8);
      opacity: 0.5;
    }
  }
</style>
