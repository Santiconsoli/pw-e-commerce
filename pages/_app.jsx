import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import SkeletonScreen from '../components/SkeletonScreen';
import '../style.css';

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const initialLoadRef = useRef(true);

  useEffect(() => {
    if (isLoading) {
      document.body.classList.add('skeleton-active');
    } else {
      document.body.classList.remove('skeleton-active');
    }

    return () => {
      document.body.classList.remove('skeleton-active');
    };
  }, [isLoading]);

  useEffect(() => {
    let finishTimer;

    const hideLoader = (delay = 180) => {
      window.clearTimeout(finishTimer);
      finishTimer = window.setTimeout(() => {
        setIsLoading(false);
      }, delay);
    };

    const handleRouteStart = () => {
      setIsLoading(true);
    };

    const handleRouteDone = () => {
      hideLoader(160);
    };

    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      const minimumBootDelay = window.setTimeout(() => {
        hideLoader(0);
      }, 850);

      router.events.on('routeChangeStart', handleRouteStart);
      router.events.on('routeChangeComplete', handleRouteDone);
      router.events.on('routeChangeError', handleRouteDone);

      return () => {
        window.clearTimeout(minimumBootDelay);
        window.clearTimeout(finishTimer);
        document.body.classList.remove('skeleton-active');
        router.events.off('routeChangeStart', handleRouteStart);
        router.events.off('routeChangeComplete', handleRouteDone);
        router.events.off('routeChangeError', handleRouteDone);
      };
    }

    router.events.on('routeChangeStart', handleRouteStart);
    router.events.on('routeChangeComplete', handleRouteDone);
    router.events.on('routeChangeError', handleRouteDone);

    return () => {
      window.clearTimeout(finishTimer);
      document.body.classList.remove('skeleton-active');
      router.events.off('routeChangeStart', handleRouteStart);
      router.events.off('routeChangeComplete', handleRouteDone);
      router.events.off('routeChangeError', handleRouteDone);
    };
  }, [router.events]);

  return (
    <>
      {isLoading && <SkeletonScreen />}
      <Component {...pageProps} />
    </>
  );
}
