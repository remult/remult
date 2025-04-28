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
      <div 
        v-for="(item, index) in faqs" 
        :key="index" 
        class="faq-item"
      >
        <div class="faq-question" @click="toggleFaq(index)">
          <h2>
            <b>{{ item.question }}</b>
            <span class="icon">{{ isOpen[index] ? '−' : '+' }}</span>
          </h2>
        </div>
        <div 
          class="faq-answer" 
          :class="{ 'is-open': isOpen[index] }"
          :style="{ height: isOpen[index] ? answerHeights[index] + 'px' : '0px' }"
        >
          <div class="faq-answer-content" v-html="item.answer" ref="answerRefs"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, onUnmounted } from 'vue'

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
const answerHeights = ref<number[]>(Array(faqs.length).fill(0))
const answerRefs = ref<HTMLElement[]>([])

const calculateHeight = (index: number) => {
  const element = answerRefs.value[index];
  if (element) {
    // Temporarily set height to auto to get the full height
    element.style.height = 'auto';
    const computedStyle = window.getComputedStyle(element);
    const paddingTop = parseFloat(computedStyle.paddingTop);
    const paddingBottom = parseFloat(computedStyle.paddingBottom);
    const marginTop = parseFloat(computedStyle.marginTop);
    const marginBottom = parseFloat(computedStyle.marginBottom);
    const containerPadding = 32; // 1rem = 16px * 2 (top and bottom)
    answerHeights.value[index] = element.scrollHeight + paddingTop + paddingBottom + marginTop + marginBottom + containerPadding;
    // Reset height
    element.style.height = '';
  }
}

const toggleFaq = (index: number) => {
  if (!isOpen.value[index]) {
    // Calculate height first
    calculateHeight(index);
    // Then set isOpen in the next tick
    nextTick(() => {
      isOpen.value[index] = true;
    });
  } else {
    isOpen.value[index] = false;
  }
}

onMounted(() => {
  // Pre-calculate heights for all answers
  nextTick(() => {
    answerRefs.value.forEach((_, index) => {
      calculateHeight(index);
    });
  });
  
  window.addEventListener('resize', () => {
    isOpen.value.forEach((open, index) => {
      if (open) {
        calculateHeight(index);
      }
    });
  });
})

onUnmounted(() => {
  window.removeEventListener('resize', () => {
    isOpen.value.forEach((open, index) => {
      if (open) {
        calculateHeight(index);
      }
    });
  });
})
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
  overflow: hidden;
  border-bottom: 1px solid #e0e0e0;
}

.faq-question {
  cursor: pointer;
  padding: 1rem 0;
  transition: background-color 0.2s ease;
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
  transition: transform 0.3s ease;
}

.faq-answer {
  overflow: hidden;
  transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
              opacity 0.3s ease, 
              transform 0.3s ease;
  border-radius: 0 0 8px 8px;
  opacity: 0;
  transform: translateY(-10px);
  pointer-events: none;
  height: 0;
  padding: 0;
}

.faq-answer.is-open {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.faq-answer.is-open .icon {
  transform: rotate(180deg);
}

.faq-answer-content {
  padding: 0.5rem 0;
}

ul {
  list-style-type: disc;
}
</style>
