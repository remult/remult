<script setup>
import Example from '../Example.vue'
import Icon from '../Icon.vue'
</script>

<template>
  <div class="examples l-home">
    <div class="examples-intro l-home__title fade-in">
      <h2>Examples</h2>
      <p>
        We have already a ton of examples! Pick and choose the one that fits
        your needs.
      </p>
    </div>
    <div class="examples-list l-home__content fade-in">
      <div class="examples-list-item">
        <div class="examples-list-item-title">
          <h3>Todo MVC</h3>
          <div class="examples-list-item-title-stack">
            <Icon tech="react" />
            <Icon tech="vite" />
            <Icon tech="express" />
          </div>
        </div>
        <p>A classic Todo MVC implementation with Remult.</p>
        <div class="examples-list-item-links">
          <a
            href="https://github.com/remult/remult/tree/main/examples/react-todo"
            target="_blank"
            rel="noopener noreferrer"
            >Github</a
          >
          <a
            href="https://codesandbox.io/s/github/remult/remult/tree/main/examples/react-todo"
            target="_blank"
            rel="noopener noreferrer"
            >Codesandbox</a
          >
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
        <p>
          A fully featured CRM! Make sure to check out the link:
          <b>Dev / Admin</b> on top right!
        </p>
        <div class="examples-list-item-links">
          <a
            href="https://github.com/remult/crm-demo"
            target="_blank"
            rel="noopener noreferrer"
            >Github</a
          >
          <a
            href="https://crm-demo.up.railway.app/"
            target="_blank"
            rel="noopener noreferrer"
            >Live Demo</a
          >
        </div>
      </div>

      <div class="examples-list-item">
        <div class="examples-list-item-title">
          <h3>Shadcn React Table</h3>
          <div class="examples-list-item-title-stack">
            <Icon tech="react" />
            <Icon tech="vite" />
            <Icon tech="express" />
            <Icon tech="postgres" />
            <Icon tech="shadcn" />
          </div>
        </div>
        <p>Using remult with server side sorting, filtering, paging & CRUD.</p>
        <div class="examples-list-item-links">
          <a
            href="https://www.github.com/remult/remult/tree/main/examples/shadcn-react-table"
            target="_blank"
            rel="noopener noreferrer"
            >Github</a
          >
          <a
            href="https://table.up.railway.app/"
            target="_blank"
            rel="noopener noreferrer"
            >Live Demo</a
          >
          <a
            href="https://stackblitz.com/github/remult/remult/tree/main/examples/shadcn-react-table"
            target="_blank"
            rel="noopener noreferrer"
            >Stackblitz</a
          >
        </div>
      </div>

      <div class="examples-list-item">
        <div class="examples-list-item-title">
          <h3>TanStack React Table</h3>
          <div class="examples-list-item-title-stack">
            <Icon tech="react" />
            <Icon tech="vite" />
            <Icon tech="tanstack" />
          </div>
        </div>
        <p>
          Example of using remult with react table - most basic design, with
          server side sorting, paging & filtering.
        </p>
        <div class="examples-list-item-links">
          <a
            href="https://www.github.com/remult/remult/tree/main/examples/tanstack-react-table"
            target="_blank"
            rel="noopener noreferrer"
            >Github</a
          >
          <a
            href="https://stackblitz.com/github/remult/remult/tree/main/examples/tanstack-react-table"
            target="_blank"
            rel="noopener noreferrer"
            >Stackblitz</a
          >
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
        <p>
          An environment to reproduce issues using stackblitz, with optional
          sqlite database.
        </p>
        <div class="examples-list-item-links">
          <a
            href="https://www.github.com/noam-honig/ready-to-play"
            target="_blank"
            rel="noopener noreferrer"
            >Github</a
          >
          <a
            href="https://stackblitz.com/github/noam-honig/ready-to-play"
            target="_blank"
            rel="noopener noreferrer"
            >Stackblitz</a
          >
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
        <p>
          Want to see remult in action in 60 sec? <br />Auth, DB, CRUD – using
          your stack.
        </p>
        <div class="examples-list-item-code">
          <code>npm init remult@latest</code>
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
    color: #b2a5db;
  }
}

.examples-list-item-links {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 10px;

  a {
    color: var(--vp-c-text);
    position: relative;
    text-decoration: none;

    &::after {
      content: '';
      color: var(--vp-c-text) !important;
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

  svg,
  img {
    height: 24px;
    width: auto;
  }
}

@media screen and (max-width: 1024px) {
  .examples-list-item-title {
    flex-direction: column-reverse;
  }

  .examples-list-item-title-stack {
    position: relative;
    display: flex;
    margin-bottom: 0.5rem;
    right: 0;
    top: 0;
  }
}

@media screen and (max-width: 768px) {
  .examples-list-item {
    width: 100%;
    margin-bottom: 2rem;
  }
}
</style>
