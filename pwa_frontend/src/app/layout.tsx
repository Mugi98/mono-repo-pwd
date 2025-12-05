import './globals.css';
import { ServiceWorkerRegister } from './sw/sw-register';
import { Toaster } from "sonner";

export const metadata = {
  title: 'Cygen PWA Auth Demo',
  description: 'PWA authentication demo',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body>
        <ServiceWorkerRegister />
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
