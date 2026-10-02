import UI from '@/ui';

describe('UI Shape - fill blur', () => {
  let ui, shape, actions, blurButton;

  beforeEach(() => {
    const options = {
      menu: ['shape'],
      initMenu: '',
      menuBarPosition: 'bottom',
    };
    ui = new UI(document.createElement('div'), options, {});
    shape = ui.shape;
    blurButton = shape._els.fillBlurButton.querySelector('.tui-image-editor-button');

    actions = {
      changeShape: jest.fn(),
      setDrawingShape: jest.fn(),
      stopDrawingMode: jest.fn(),
      discardSelection: jest.fn(),
      changeSelectableAll: jest.fn(),
      modeChange: jest.fn(),
    };
    shape.addEvent(actions);
  });

  it('should apply a filter-type blur fill and mark the button active when toggled on', () => {
    blurButton.click();

    expect(shape.isFillBlur).toBe(true);
    expect(blurButton.classList.contains('active')).toBe(true);
    expect(actions.changeShape).toHaveBeenCalledWith({
      fill: { type: 'filter', filter: [{ blur: expect.any(Number) }] },
    });
    expect(shape.options.fill).toEqual({ type: 'filter', filter: [{ blur: expect.any(Number) }] });
  });

  it('should restore the plain fill color and unmark the button when toggled off again', () => {
    shape._els.fillColorpicker.color = '#ff0000';

    blurButton.click();
    blurButton.click();

    expect(shape.isFillBlur).toBe(false);
    expect(blurButton.classList.contains('active')).toBe(false);
    expect(actions.changeShape).toHaveBeenLastCalledWith({ fill: '#ff0000' });
  });

  it('should turn blur off again when a fill color is picked', () => {
    blurButton.click();
    expect(shape.isFillBlur).toBe(true);

    shape._els.fillColorpicker.fire('change', '#00ff00');

    expect(shape.isFillBlur).toBe(false);
    expect(blurButton.classList.contains('active')).toBe(false);
  });

  it('should reflect an already-blurred shape as active when it becomes the active object', () => {
    shape.setShapeStatus({
      strokeWidth: 3,
      strokeColor: '#000000',
      fillColor: { type: 'filter', filter: [{ blur: 0.3 }] },
    });

    expect(shape.isFillBlur).toBe(true);
    expect(blurButton.classList.contains('active')).toBe(true);
  });

  it('should reflect a plain-color shape as not blurred when it becomes the active object', () => {
    blurButton.click();
    expect(shape.isFillBlur).toBe(true);

    shape.setShapeStatus({
      strokeWidth: 3,
      strokeColor: '#000000',
      fillColor: { type: 'color', color: '#ff0000' },
    });

    expect(shape.isFillBlur).toBe(false);
    expect(blurButton.classList.contains('active')).toBe(false);
    expect(shape._els.fillColorpicker.color).toBe('#ff0000');
  });

  describe('blur intensity range', () => {
    it('should apply the chosen intensity and turn blur on when dragged, even if blur was off', () => {
      expect(shape.isFillBlur).toBe(false);

      shape._els.fillBlurRange.value = 0.8;
      shape._els.fillBlurRange.fire('change', 0.8, true);

      expect(shape.isFillBlur).toBe(true);
      expect(blurButton.classList.contains('active')).toBe(true);
      expect(actions.changeShape).toHaveBeenLastCalledWith(
        { fill: { type: 'filter', filter: [{ blur: 0.8 }] } },
        false
      );
    });

    it('should reflect the blur value of an already-blurred shape when it becomes the active object', () => {
      shape.setShapeStatus({
        strokeWidth: 3,
        strokeColor: '#000000',
        fillColor: { type: 'filter', filter: [{ blur: 0.75 }] },
      });

      expect(shape._els.fillBlurRange.value).toBe(0.75);
    });
  });
});
