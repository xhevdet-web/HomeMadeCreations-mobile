import { ReactElement, useMemo } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

export function ReorderGestureLayer({ children, enabled, onStart, onMove, onEnd }: {
  children: ReactElement;
  enabled: boolean;
  onStart: (x: number, y: number) => void;
  onMove: (x: number, y: number) => void;
  onEnd: (x: number, y: number, canceled: boolean) => void;
}) {
  const gesture = useMemo(() => Gesture.Pan().activateAfterLongPress(180).runOnJS(true)
    .enabled(enabled)
    .onStart((event) => onStart(event.absoluteX, event.absoluteY))
    .onUpdate((event) => onMove(event.absoluteX, event.absoluteY))
    .onFinalize((event, success) => onEnd(event.absoluteX, event.absoluteY, !success)),
  [enabled, onStart, onMove, onEnd]);
  return <GestureDetector gesture={gesture}>{children}</GestureDetector>;
}
