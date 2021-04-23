# Using Postgres on your Dev Machine

## Install Postgres database   
We'll use the great and free database called Postgres

Download and install it from:
[https://www.enterprisedb.com/downloads/postgres-postgresql-downloads](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads)

In this demo we've used Windows x86-64 version, 11.5

1. Download and run the setup.
2. Click next, next
4. In the `Select Components` screen, un-check the `Stack Builder` we don't need it.

![](/2019-09-22_18h11_31.png)

5. Next, next
7. You are prompted for a password, give it a password, and remember it (we'll need it later)
::: tip
 when creating this demo we used the password: MASTERKEY
:::
![enter password](/2019-09-22_18h06_08.png)

From here on, just click next next next, till the setup is complete.


## Update the project's .env file
If you did not use the default password we've used (MASTERKEY), then you can change the postgres password, in the `.env` file in your project,
just replace the word (MASTERKEY) with the password you've chosen for the postgres database.

Don't worry, your password is safe, the `.env` file exists only locally on your dev machine and is never sent anywhere.
