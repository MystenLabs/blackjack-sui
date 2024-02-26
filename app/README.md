# PoC Template app/ directory - UI, API & DB

This is a [Next.js](https://nextjs.org/) project bootstrapped with [PoC Template NextJS](https://github.com/MystenLabs/poc-template-nextjs)

### Usage

- Install the npm dependencies with: `pnpm install`
- Start the development server with `pnpm run dev`
- Build the project with: `pnpm run build`
- Serve the built project with: `pnpm run start`

### Environment variables

- The `.env` file contains all of the environmental variables that are not secret and therefore can be tracked by git
- The secret .env variables, such as the following ones, should be stored inside a separate `.env.development.local` file:
  - `SHINAMI_GAS_STATION_API_KEY`
  - `ADMIN_SECRET_KEY` (private key of the Sui account that acts as the house)

### Directories structure

- `src/`
  - `app/`:
    - contains all the .tsx files, that are renderred as pages of the UI
    - organized in subdirectories based on the desired URL path of each page in the final UI
    - for more details, see: [NextJS App Router: Defining Routes](https://nextjs.org/docs/app/building-your-application/routing/defining-routes)
  - `components/`:
    - contains the code for all the tsx components
    - organized in subdirectories based on the usage of each component
  - `constants/`
  - `contexts/`:
    - contains the code for all the React Providers and Contexts used to organize the project's global storage
  - `helpers/`
  - `hooks/`:
    - contains the TS code for all the custom react hooks that are being used in this app
  - `lib/`:
    - auto-generated directory, created upon the setup of the Radix UI and Shadcn libraries
  - `styles/`:
    - contains the global css file, used mainly for the colors of the UI components
  - `types/`:
    - contains some globally used TS interfaces of the project

### Main libraries used in the UI

- UI components:
  - [Radix UI](https://www.radix-ui.com/)
  - [Shadcn](https://ui.shadcn.com/)
- Sui integration:
  - [Mysten Sui js](https://www.npmjs.com/package/@mysten/sui.js)
  - [Mysten Enoki](https://www.npmjs.com/package/@mysten/enoki)
- Forms:
  - [React hook form](https://react-hook-form.com/)
  - [Zod](https://zod.dev/)
- Carousels:
  - [React slick](https://www.npmjs.com/package/react-slick)
- PWA:
  - [Next PWA](https://www.npmjs.com/package/next-pwa)

### Adding a new page to the UI

- This NextJS project was bootstrapped with the [NextJS App Router](https://nextjs.org/docs/app/building-your-application/routing)
- To add a new page in the `/example` path, head into `/app/src/app` directory, and:
  - create an `example` directory
  - create a `page.tsx` (naming convention of the framework) file under it
  - export your component as the `default export`
- In the same way, to add a new page in the `example/of/nested/path`, head into the `/app/src/app` directory, and:
  - create the nested `example/of/nested/path` directories:
  - create a `page.tsx` file under it
  - export your component as the `default export`
  - you can check the existing `/admin/test` page as an example
- To set up a page with `dynamic routing` (for example http://localhost:3000/posts/3), follow the steps of this guide: [NextJS App Router Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)

### Adding a new endpoint to the API

- This NextJS project was bootstrapped with the [NextJS App Router](https://nextjs.org/docs/app/building-your-application/routing)
- To add a new endpoint in the `/api/example` path, head into `/app/src/app/api` directory, and:

  - create an `example` directory
  - create a `route.ts` (naming convention of the framework) file under it
  - name your function based on the HTTP method you would like to use
    - For example export const `GET`, export const `POST`
  - in case of integrating with the `vercel KV storage`, add the following lines to disable the default caching behaviour on the deployed environment (see `api/visits/route.ts` as an example)
    - before the function:
      - export const fetchCache = "force-no-store";
      - export const revalidate = 1;
    - inside the function:
      - const path = request.nextUrl.searchParams.get("path") || "/";
      - revalidatePath(path);

- To set up an endpoint with `dynamic routing` (for example http://localhost:3000/api/posts/3), follow the steps of this guide: [NextJS App Router Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
- The syntax to access the dynamic routing parameter inside the endpoint is:
  ```
  export const GET = async (
    request: NextRequest,
    { params }: { params: { id: string } }
  ) => {
    ...
  }
  ```

### Integration with Sui

- In the Template PoC, we use the Wallet extensions of the browsers to sign the transactions
- The signing and the execution of the transacions are happening in separate steps, in order to be able to explicitly specify the url of the full node in the `executeSignedTransactionBlock` of the custom `useSui` (app/src/hooks/useSui.ts) hook
- A simple example of creating, signing, and executing a `TransactionBlock` from the UI is developed in the `useTransferSUI` (app/src/hooks/useTransferSUI.ts) custom hook, which is used in the `TransferSUIForm` (app/src/components/transferSUI/TransferSUIForm.tsx) component

### Local development with Vercel KV

- Of course at first:
  - create a `new project` in the vercel UI
  - `import` the corresponding `GitHub repo` from MystenLabs (need to ask for access if it is not listed)
  - In the `Storage` tab create and attach a Vercel KV Storage instance
- To be able to connect with the vercel KV storage in the local development environment, please follow the steps:
  - install vercel cli
  - run `vercel link` in the root directory of the project
  - select `Mysten Labs`
  - link to existing project
  - run `vercel env pull app/.env.development.local`
    - the created `app/.env.development.local` file should have the same format with the `app/.env.development.local.example` directory
  - start the dev server with:
    - `pnpm run dev` inside the app directory
    - or `vercel dev` in the project's root directory
  - visit the url: `http://localhost:3000/api/visits` in your browser, and observe the `pageVisits` counter being incremented with each visit

### Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!
