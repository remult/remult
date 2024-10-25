<script setup>
  import Icon from '../../../components/Icon.vue'
</script>

# Select one of these Server

<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 5rem; margin-top: 2rem">
	<Icon tech="express" sizeIco=150 link="/docs/installation/server/express" />
	<Icon tech="fastify" sizeIco=150 link="/docs/installation/server/fastify" />
	<Icon tech="hono" sizeIco=150 link="/docs/installation/server/hono" />
	<Icon tech="hapi" sizeIco=150 link="/docs/installation/server/hapi" />
	<Icon tech="koa" sizeIco=150 link="/docs/installation/server/koa" />
	<Icon tech="nest" sizeIco=150 link="/docs/installation/server/nest" />
</div>
