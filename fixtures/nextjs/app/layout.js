export const metadata = { title: 'Synthetic Next.js boundary fixture' };
export default function Layout({ children }) {
  return <html lang="en"><head><link rel="stylesheet" href="/asset.css" /></head><body>{children}</body></html>;
}
