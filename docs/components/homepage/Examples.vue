<script setup>
import Example from '../Example.vue'
import Icon from '../Icon.vue'
</script>

<template>
  <div class="examples l-home">
    <div class="examples-intro l-home__title">
      <h2>Examples</h2>
      <p>We have already a ton of examples! Pick and choose the one that fits your needs.</p>
    </div>
    <div class="examples-list l-home__content">

      <div class="examples-list-item">
        <div class="examples-list-item-title">
          <h3>Todo MVC</h3>
          <div class="examples-list-item-title-stack">
            <Icon tech="react" />
            <Icon tech="vite" />
            <Icon tech="express" />
          </div>
        </div>
        <p>A fully featured CRM! Make sure to check out the dev and admin links on the top right.</p>
        <div class="examples-list-item-links">
          <a href="https://github.com/remult/TodoMVC-example">Github</a>
          <a href="https://codesandbox.io/s/github/remult/TodoMVC-example?file=/src/frontend/App.tsx">Codesandbox</a>
        </div>
      </div>

      <div class="examples-list-item">
        <div class="examples-list-item-title">
          <h3>CRM</h3>
          <div class="examples-list-item-title-stack">
            <Icon tech="react" />
            <Icon tech="vite" />
            <Icon tech="express" />
            <Icon tech="postgres" />
            <Icon tech="mui" />
          </div>
        </div>
        <p>A fully featured CRM! Make sure to check out the dev and admin links on the top right.</p>
        <div class="examples-list-item-links">
          <a href="https://github.com/remult/crm-demo">Github</a>
          <a href="https://codesandbox.io/s/github/remult/crm-demo?file=/src/frontend/App.tsx">Codesandbox</a>
        </div>
      </div>

      <div class="examples-list-item">
        <div class="examples-list-item-title">
          <h3>Shadcn React Table</h3>
          <div class="examples-list-item-title-stack">
            <Icon tech="react" />
            <Icon tech="vite" />
          </div>
        </div>
        <p>Using remult with server side sorting, filtering, paging & CRUD.</p>
        <div class="examples-list-item-links">
          <a href="https://github.com/remult/shadcn-react-table">Github</a>
          <a href="https://codesandbox.io/s/github/remult/shadcn-react-table?file=/src/frontend/App.tsx">Codesandbox</a>
        </div>
      </div>

      <div class="examples-list-item">
        <div class="examples-list-item-title">
          <h3>TanStack React Table</h3>
          <div class="examples-list-item-title-stack">
            <Icon tech="react" />
          </div>
        </div>
        <p>Example of using remult with react table - most basic design, with server side sorting, paging & filtering.</p>
        <div class="examples-list-item-links">
          <a href="https://github.com/remult/tanstack-react-table">Github</a>
          <a href="https://codesandbox.io/s/github/remult/tanstack-react-table?file=/src/frontend/App.tsx">Codesandbox</a>
        </div>
      </div>

      <div class="examples-list-item">
        <div class="examples-list-item-title">
          <h3>Ready to Play</h3>
          <div class="examples-list-item-title-stack">
            <Icon tech="react" />
            <Icon tech="vite" />
            <Icon tech="sqlite" />
            <Icon tech="express" />
          </div>
        </div>
        <p>An environment to reproduce issues using stackblitz, with optional sqlite database.</p>
        <div class="examples-list-item-links">
          <a href="https://github.com/remult/ready-to-play">Github</a>
          <a href="https://codesandbox.io/s/github/remult/ready-to-play?file=/src/frontend/App.tsx">Codesandbox</a>
        </div>
      </div>

      <div class="examples-list-item">
        <div class="examples-list-item-title">
          <h3>Need more?</h3>
          <div class="examples-list-item-title-stack">
            <Icon tech="react" />
            <Icon tech="angular" />
            <Icon tech="svelte" />
            <Icon tech="vue" />
            <Icon tech="postgres" />
            <Icon tech="sqlite" />
            <Icon tech="mongodb" />
            <Icon tech="mysql" />
          </div>
        </div>
        <p>Want to see remult in action in 60 sec? <br>Auth, DB, CRUD – using your stack.</p>
        <div class="examples-list-item-code">
          <code>npm create remult@latest</code>
        </div>
      </div>

      </div>
    </div>
</template>

<style>
.examples {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.examples .examples-list {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 40px;
}

.examples-list-item {
  display: flex;
  width: calc(50% - 20px);
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  margin-bottom: 20px;

  p {
    color: #8262E1;
  }
}

.examples-list-item-links {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 10px;

  a {
    color: #fff;
    position: relative;

    &::after {
      content: '';
      color: #fff !important;
    }
  }
}

.examples-list-item-title {
  display: flex;
  position: relative;
  width: 100%;
}

.examples-list-item-title-stack {
  display: flex;
  gap: 5px;
  position: absolute;
  right: 0;
  top: 0;
  
  span {
    display: none;
  }

  svg {
    height: 24px;
    width: auto;
  }
}


</style>
