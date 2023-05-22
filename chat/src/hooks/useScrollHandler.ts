import { useEffect, useRef } from 'react';

interface UseScrollHandlerProps {
    onScrollUp: () => void;
}

export function useScrollHandler({ onScrollUp }: UseScrollHandlerProps) {
    const ref = useRef<HTMLDivElement | null>(null);
    const scrollPosition = useRef(-1);

    const handleScroll = () => {
        const position = ref.current?.scrollTop;
        if (position !== undefined) {
            if (position < scrollPosition.current) {
                onScrollUp();
            }
            scrollPosition.current = position;
        }
    };

    useEffect(() => {
        ref.current?.addEventListener('scroll', handleScroll, { passive: true });
        return () => ref.current?.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    return ref;
}
