import Range from '@/ui/tools/range';
import { defaultRotateRangeValues } from '@/consts';

describe('Range', () => {
  let range, input, slider;

  beforeEach(() => {
    input = document.createElement('input');
    slider = document.createElement('div');
    range = new Range({ slider, input }, defaultRotateRangeValues);
  });

  it('should be incremented by one when keyCode 38 is found in the event handler with changeInputWithArrow', () => {
    const ev = { target: input, keyCode: 38 };
    input.value = '3';

    range.eventHandler.changeInputWithArrow(ev);

    expect(range.value).toBe(4);
  });

  it('should be decremented by one when keyCode 40 is found in the event handler with changeInputWithArrow', () => {
    const ev = { target: input, keyCode: 40 };
    input.value = '3';

    range.eventHandler.changeInputWithArrow(ev);

    expect(range.value).toBe(2);
  });

  it('should filter out any invalid input values', () => {
    const ev = { target: input, keyCode: 83, preventDefault: jest.fn() };
    input.value = '-3!!6s0s';

    range.eventHandler.changeInput(ev);

    expect(range.value).toBe(0);
  });

  it('should not produce NaN when dragging the pointer while the slider has no measurable width', () => {
    // Simulates a slider whose container had no rendered width when it was
    // constructed (e.g. its panel was hidden), which used to make every
    // subsequent drag resolve to NaN.
    range.rangeWidth = NaN;

    range.eventHandler.startChangingSlide({ screenX: 0 });
    range.eventHandler.changeSlide({ screenX: 50 });
    range.eventHandler.stopChangingSlide();

    expect(range.value).not.toBeNaN();
    expect(input.value).not.toBe('NaN');
  });

  it('should not produce NaN when clicking the slider track while it has no measurable width', () => {
    range.rangeWidth = NaN;

    range.eventHandler.changeSlideFinally({
      stopPropagation: jest.fn(),
      target: { className: 'tui-image-editor-range' },
      offsetX: 50,
    });

    expect(range.value).not.toBeNaN();
    expect(input.value).not.toBe('NaN');
  });

  it('should ignore a non-finite max value instead of corrupting the range', () => {
    const { min } = range;

    range.max = undefined;

    expect(range.max).not.toBeUndefined();
    expect(range.min).toBe(min);
  });
});
