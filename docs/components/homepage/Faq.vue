<template>
  <div class="faq l-home">
    <div class="faq-intro l-home__title">
      <h2>Frequently Asked Questions</h2>
      <p>
        We've compiled a list of common questions and answers to help you get started with Remult.
        If you have any other questions, please don't hesitate to ask us on <a href="https://discord.gg/GXHk7ZfuG5">discord</a> or <a href="https://github.com/remult/remult/issues">github</a>!
      </p>
    </div>
    <div class="faq-list l-home__content">
      <details 
        v-for="(item, index) in faqs" 
        :key="index" 
        class="faq-item"
        :open="isOpen[index]"
        @toggle="handleToggle(index, $event)"
      >
        <summary class="faq-question">
          <h2>
            <b>{{ item.question }}</b>
            <span class="icon">{{ isOpen[index] ? '−' : '+' }}</span>
          </h2>
        </summary>
        <div class="faq-answer">
          <div v-html="item.answer"></div>
        </div>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface FaqItem {
  question: string
  answer: string
}

const faqs: FaqItem[] = [
  {
    question: 'Is remult an ORM?',
    answer: `<p>Remult is also an ORM! But not limited to! <i>That's just the tip of the iceberg! 🏔️</i></p>
    <p>Think of it as a Swiss Army knife for full-stack devs:</p>
    <ul>
      <li>REST out of the box, and you can add GraphQL, swagger, ...</li>
      <li>Built-in validation mechanism, you don't need Zod, or yop, or joi, or ...</li>
      <li>Metadata to have SSoT (Single Source of Truth) for eveything: labels, permissions, auth, ...</li>
      <li>And yes, you don't need Prisma or Drizzle anymore!</li>
    </ul>`,
  },
  {
    question: 'Can I use Remult in my existing app?',
    answer: `<p>Absolutely! 🚀</p>
    <p>No need to rewrite everything overnight. Just:</p>
    <ol>
      <li>Add Remult to your current stack</li>
      <li>Implement the "getUser" function</li>
      <li>Start using it alongside your existing code</li>
    </ol>
    <p>One of our users migrated their project over a year, and guess what? 
    They ended up with 75% less code! Talk about a productivity boost! 💪</p>`,
  },
  {
    question: 'Why is it different from other libs?',
    answer: `<p>Remult stands out in several key ways:</p>
    <ul>
      <li>It's fully yours - we don't host anything for you! You are in full control of your application and data</li>
      <li>We provide a complete toolkit for managing your full application, including ready-to-use Live Queries</li>
      <li>Unlike many other solutions, Remult gives you the freedom to build exactly what you need without vendor lock-in</li>
    </ul>`,
  },
  {
    question: 'Does it Scale?',
    answer: `<p>Scaling is a common concern, but it's important to ask: Scale in what direction?</p>
    <ul>
      <li>Number of users? ✅</li>
      <li>Number of recurring users? ✅</li>
      <li>Time spent by users? ✅</li>
      <li>Database size? ✅</li>
    </ul>
    <p>Yes, Remult scales in all these directions and more! Join our community to share your scaling metrics and learn from others' experiences 🚀</p>`,
  },
  {
    question: 'Missing something?',
    answer: `We're always looking for ways to improve Remult. 
    If you have a feature request or a bug report, please let us know
    on <a href="https://discord.gg/GXHk7ZfuG5">discord</a> or <a href="https://github.com/remult/remult/issues">github</a>!`,
  },
]

const isOpen = ref<boolean[]>(Array(faqs.length).fill(false))

const handleToggle = (index: number, event: Event) => {
  const details = event.target as HTMLDetailsElement;
  isOpen.value[index] = details.open;
}

const toggleFaq = (index: number) => {
  isOpen.value[index] = !isOpen.value[index]
}
</script>

<style>
.faq {
  display: flex;
  gap: 1rem;
}

.faq-intro {
  width: 30%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.faq-item {
  margin-bottom: 1rem;
  border-radius: 8px;
  overflow: hidden;
}

.faq-question {
  cursor: pointer;
  padding: 1rem;
  background-color: var(--vp-c-bg-alt);
  border-radius: 8px;
  list-style: none;
}

.faq-question::-webkit-details-marker {
  display: none;
}

.faq-question h2 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0;
  font-size: 1.1rem;
}

.faq-question .icon {
  font-size: 1.5rem;
  font-weight: bold;
}

.faq-answer {
  padding: 0 1rem;
  max-height: 0;
  overflow: hidden;
  transition: all 0.3s ease;
  background-color: var(--vp-c-bg-soft);
  border-radius: 0 0 8px 8px;
}

details[open] .faq-answer {
  max-height: 1000px;
  padding: 1rem;
}

ul {
  list-style-type: disc;
}
</style>
