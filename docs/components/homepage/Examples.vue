<script setup>
import Example from '../Example.vue'
</script>

<template>
  <div class="examples l-home">
    <div class="examples-intro l-home__title">
      <h2>Examples</h2>
      <p>
        We've compiled a list of common questions and answers to help you get
        started with Remult. If you have any other questions, please don't
        hesitate to ask us on
        <a href="https://discord.gg/GXHk7ZfuG5">discord</a> or
        <a href="https://github.com/remult/remult/issues">github</a>!
      </p>
    </div>
    <div class="examples-list l-home__content">
      <div class="examples-list-item">
        <Example
          imgSrc="/example-apps/todoMVC.png"
          :react="true"
          :vite="true"
          :express="true"
          github="https://github.com/remult/TodoMVC-example"
          codesandbox="https://codesandbox.io/s/github/remult/TodoMVC-example?file=/src/frontend/App.tsx"
        />

        <Example
          imgSrc="/example-apps/CRM.png"
          :react="true"
          :vite="true"
          :express="true"
          :postgres="true"
          :mui="true"
          live="https://crm-demo.up.railway.app/"
          github="https://github.com/remult/crm-demo"
        />

        <Example
          imgSrc="/example-apps/shadcn.png"
          :react="true"
          :vite="true"
          :express="true"
          :postgres="true"
          :shadcn="true"
          live="https://table.up.railway.app/"
          github="https://www.github.com/remult/remult/tree/main/examples/shadcn-react-table"
          stackblitz="https://stackblitz.com/github/remult/remult/tree/main/examples/shadcn-react-table"
        />

        <Example
          title="TanStack React Table"
          imgSrc="/example-apps/tanStack.png"
          :react="true"
          :vite="true"
          :tanstack="true"
          github="https://www.github.com/remult/remult/tree/main/examples/tanstack-react-table"
          stackblitz="https://stackblitz.com/github/remult/remult/tree/main/examples/tanstack-react-table"
        />

        <Example
          imgSrc="/example-apps/ready-to-play.png"
          :react="true"
          :vite="true"
          :sqlite="true"
          :express="true"
          github="https://www.github.com/noam-honig/ready-to-play"
          stackblitz="https://stackblitz.com/github/noam-honig/ready-to-play"
        />
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
</style>
