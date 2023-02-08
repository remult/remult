# Deployment

Let's deploy the todo app to [vercel](https://vercel.com/).

//TODO - add ably etc...

## Create a github repo

Vercel deploys automatically whenever you push to github, so the first step of deployment is to create a github repo and push all your changes to it.

## Create a vercel project

1. Create a vercel account if you don't already have one.
2. Goto [https://vercel.com/new](https://vercel.com/new)
3. Select your `github` repo and click `import`
4. Configure the project's name and in the `> Environment Variables` section set the `DATABASE_URL` and `NEXTAUTH_SECRET` environment variables
5. Click `Deploy`

That's it - our application is deployed to production, play with it and enjoy.

To see a larger more complex code base, visit our [CRM example project](https://www.github.com/remult/crm-demo)

Love Remult?&nbsp;<a href="https://github.com/remult/remult" target="_blank" rel="noopener"> Give our repo a star.⭐</a>
