import forEachArray from 'tui-code-snippet/collection/forEachArray';
import Colorpicker from '@/ui/tools/colorpicker';
import Range from '@/ui/tools/range';
import Submenu from '@/ui/submenuBase';
import templateHtml from '@/ui/template/submenu/shape';
import { toInteger, assignmentForDestroy } from '@/util';
import { defaultShapeStrokeValues, eventNames, selectorNames, SHAPE_FILL_TYPE } from '@/consts';

const SHAPE_DEFAULT_OPTION = {
  stroke: '#ffbb3b',
  fill: '',
  strokeWidth: 3,
};

// Default blur intensity applied to a shape's fill when "Blur" is toggled on.
const FILL_BLUR_VALUE = 0.3;
const FILL_BLUR_RANGE_VALUES = {
  realTimeEvent: true,
  min: 0,
  max: 1,
  value: FILL_BLUR_VALUE,
  useDecimal: true,
};

/**
 * Shape ui class
 * @class
 * @ignore
 */
class Shape extends Submenu {
  constructor(subMenuElement, { locale, makeSvgIcon, menuBarPosition, usageStatistics }) {
    super(subMenuElement, {
      locale,
      name: 'shape',
      makeSvgIcon,
      menuBarPosition,
      templateHtml,
      usageStatistics,
    });
    this.type = null;
    this.options = SHAPE_DEFAULT_OPTION;
    this.isFillBlur = false;

    this._els = {
      shapeSelectButton: this.selector('.tie-shape-button'),
      shapeColorButton: this.selector('.tie-shape-color-button'),
      fillBlurButton: this.selector('.tie-fill-blur-button'),
      strokeRange: new Range(
        {
          slider: this.selector('.tie-stroke-range'),
          input: this.selector('.tie-stroke-range-value'),
        },
        defaultShapeStrokeValues
      ),
      fillBlurRange: new Range(
        {
          slider: this.selector('.tie-fill-blur-range'),
          input: this.selector('.tie-fill-blur-range-value'),
        },
        FILL_BLUR_RANGE_VALUES
      ),
      fillColorpicker: new Colorpicker(this.selector('.tie-color-fill'), {
        defaultColor: '',
        toggleDirection: this.toggleDirection,
        usageStatistics: this.usageStatistics,
      }),
      strokeColorpicker: new Colorpicker(this.selector('.tie-color-stroke'), {
        defaultColor: '#ffbb3b',
        toggleDirection: this.toggleDirection,
        usageStatistics: this.usageStatistics,
      }),
    };

    this.colorPickerControls.push(this._els.fillColorpicker);
    this.colorPickerControls.push(this._els.strokeColorpicker);

    this.colorPickerInputBoxes = [];
    this.colorPickerInputBoxes.push(
      this._els.fillColorpicker.colorpickerElement.querySelector(
        selectorNames.COLOR_PICKER_INPUT_BOX
      )
    );
    this.colorPickerInputBoxes.push(
      this._els.strokeColorpicker.colorpickerElement.querySelector(
        selectorNames.COLOR_PICKER_INPUT_BOX
      )
    );
  }

  /**
   * Destroys the instance.
   */
  destroy() {
    this._removeEvent();
    this._els.strokeRange.destroy();
    this._els.fillBlurRange.destroy();
    this._els.fillColorpicker.destroy();
    this._els.strokeColorpicker.destroy();

    assignmentForDestroy(this);
  }

  /**
   * Add event for shape
   * @param {Object} actions - actions for shape
   *   @param {Function} actions.changeShape - change shape mode
   *   @param {Function} actions.setDrawingShape - set drawing shape
   */
  addEvent(actions) {
    this.eventHandler.shapeTypeSelected = this._changeShapeHandler.bind(this);
    this.actions = actions;

    this.eventHandler.fillBlurToggled = this._changeFillBlurHandler.bind(this);

    this._els.shapeSelectButton.addEventListener('click', this.eventHandler.shapeTypeSelected);
    this._els.fillBlurButton.addEventListener('click', this.eventHandler.fillBlurToggled);
    this._els.strokeRange.on('change', this._changeStrokeRangeHandler.bind(this));
    this._els.fillBlurRange.on('change', this._changeFillBlurRangeHandler.bind(this));
    this._els.fillColorpicker.on('change', this._changeFillColorHandler.bind(this));
    this._els.strokeColorpicker.on('change', this._changeStrokeColorHandler.bind(this));
    this._els.fillColorpicker.on('changeShow', this.colorPickerChangeShow.bind(this));
    this._els.strokeColorpicker.on('changeShow', this.colorPickerChangeShow.bind(this));

    forEachArray(
      this.colorPickerInputBoxes,
      (inputBox) => {
        inputBox.addEventListener(eventNames.FOCUS, this._onStartEditingInputBox.bind(this));
        inputBox.addEventListener(eventNames.BLUR, this._onStopEditingInputBox.bind(this));
      },
      this
    );
  }

  /**
   * Remove event
   * @private
   */
  _removeEvent() {
    this._els.shapeSelectButton.removeEventListener('click', this.eventHandler.shapeTypeSelected);
    this._els.fillBlurButton.removeEventListener('click', this.eventHandler.fillBlurToggled);
    this._els.strokeRange.off();
    this._els.fillBlurRange.off();
    this._els.fillColorpicker.off();
    this._els.strokeColorpicker.off();

    forEachArray(
      this.colorPickerInputBoxes,
      (inputBox) => {
        inputBox.removeEventListener(eventNames.FOCUS, this._onStartEditingInputBox.bind(this));
        inputBox.removeEventListener(eventNames.BLUR, this._onStopEditingInputBox.bind(this));
      },
      this
    );
  }

  /**
   * Set Shape status
   * @param {Object} options - options of shape status
   *   @param {string} strokeWidth - stroke width
   *   @param {string} strokeColor - stroke color
   *   @param {(ShapeFillOption | string)} fillColor - fill option, as reported by
   *    {@link Shape#makeFillPropertyForUserEvent} ({type: 'color', color} or {type: 'filter', filter})
   */
  setShapeStatus({ strokeWidth, strokeColor, fillColor }) {
    this._els.strokeRange.value = strokeWidth;
    this._els.strokeColorpicker.color = strokeColor;

    this.options.stroke = strokeColor;
    this.options.fill = this._syncFillStatus(fillColor);
    this.options.strokeWidth = strokeWidth;

    this.actions.setDrawingShape(this.type, { strokeWidth });
  }

  /**
   * Sync the fill-related controls (blur toggle, blur range, fill color
   * picker) to the given fill option.
   * @param {(ShapeFillOption | undefined)} fillColor - fill option, as reported by
   *    {@link Shape#makeFillPropertyForUserEvent} ({type: 'color', color} or {type: 'filter', filter})
   * @returns {(ShapeFillOption | string | undefined)} value to store as this.options.fill
   * @private
   */
  _syncFillStatus(fillColor) {
    const isFillBlur = !!fillColor && fillColor.type === SHAPE_FILL_TYPE.FILTER;
    this.isFillBlur = isFillBlur;
    this._getFillBlurButtonElement().classList.toggle('active', isFillBlur);

    if (isFillBlur) {
      const blurFilter = fillColor.filter.find((filter) => 'blur' in filter);
      this._els.fillBlurRange.value = blurFilter ? blurFilter.blur : FILL_BLUR_VALUE;

      return fillColor;
    }

    const color = fillColor && fillColor.color;
    this._els.fillColorpicker.color = color;

    return color;
  }

  /**
   * Executed when the menu starts.
   */
  changeStartMode() {
    this.actions.stopDrawingMode();
  }

  /**
   * Returns the menu to its default state.
   */
  changeStandbyMode() {
    this.type = null;
    this.actions.changeSelectableAll(true);
    this._els.shapeSelectButton.classList.remove('circle');
    this._els.shapeSelectButton.classList.remove('triangle');
    this._els.shapeSelectButton.classList.remove('rect');
  }

  /**
   * set range stroke max value
   * @param {number} maxValue - expect max value for change
   */
  setMaxStrokeValue(maxValue) {
    let strokeMaxValue = maxValue;
    if (strokeMaxValue <= 0) {
      strokeMaxValue = defaultShapeStrokeValues.max;
    }
    this._els.strokeRange.max = strokeMaxValue;
  }

  /**
   * Set stroke value
   * @param {number} value - expect value for strokeRange change
   */
  setStrokeValue(value) {
    this._els.strokeRange.value = value;
    this._els.strokeRange.trigger('change');
  }

  /**
   * Get stroke value
   * @returns {number} - stroke range value
   */
  getStrokeValue() {
    return this._els.strokeRange.value;
  }

  /**
   * Change icon color
   * @param {object} event - add button event object
   * @private
   */
  _changeShapeHandler(event) {
    const button = event.target.closest('.tui-image-editor-button');
    if (button) {
      this.actions.stopDrawingMode();
      this.actions.discardSelection();
      const shapeType = this.getButtonType(button, ['circle', 'triangle', 'rect']);

      if (this.type === shapeType) {
        this.changeStandbyMode();

        return;
      }
      this.changeStandbyMode();
      this.type = shapeType;
      event.currentTarget.classList.add(shapeType);
      this.actions.changeSelectableAll(false);
      this.actions.modeChange('shape');
    }
  }

  /**
   * Change stroke range
   * @param {number} value - stroke range value
   * @param {boolean} isLast - Is last change
   * @private
   */
  _changeStrokeRangeHandler(value, isLast) {
    this.options.strokeWidth = toInteger(value);
    this.actions.changeShape(
      {
        strokeWidth: value,
      },
      !isLast
    );

    this.actions.setDrawingShape(this.type, this.options);
  }

  /**
   * Change shape color
   * @param {string} color - fill color
   * @private
   */
  _changeFillColorHandler(color) {
    color = color || 'transparent';
    this.isFillBlur = false;
    this._getFillBlurButtonElement().classList.remove('active');
    this.options.fill = color;
    this.actions.changeShape({
      fill: color,
    });
  }

  /**
   * Toggle a blurred-fill (the shape fill shows a blurred version of what's
   * underneath, instead of a flat color) on or off for the current shape.
   * @param {object} event - click event
   * @private
   */
  _changeFillBlurHandler(event) {
    const button = event.target.closest('.tui-image-editor-button');
    if (!button) {
      return;
    }

    this.isFillBlur = !this.isFillBlur;
    button.classList.toggle('active', this.isFillBlur);

    const fill = this.isFillBlur
      ? this._makeFillBlurOption(this._els.fillBlurRange.value)
      : this._els.fillColorpicker.color || 'transparent';

    this.options.fill = fill;
    this.actions.changeShape({ fill });
  }

  /**
   * Change the blur intensity of the current blurred fill.
   * Dragging the slider also turns the blur fill on, since adjusting an
   * intensity that has no visible effect would be confusing.
   * @param {number} value - blur range value
   * @param {boolean} isLast - Is last change
   * @private
   */
  _changeFillBlurRangeHandler(value, isLast) {
    if (!this.isFillBlur) {
      this.isFillBlur = true;
      this._getFillBlurButtonElement().classList.add('active');
    }

    const fill = this._makeFillBlurOption(value);
    this.options.fill = fill;
    this.actions.changeShape({ fill }, !isLast);
  }

  /**
   * Make a filter-type fill option for the given blur intensity.
   * @param {number} blurValue - blur intensity (0-1)
   * @returns {ShapeFillOption}
   * @private
   */
  _makeFillBlurOption(blurValue) {
    return { type: SHAPE_FILL_TYPE.FILTER, filter: [{ blur: blurValue }] };
  }

  /**
   * Get the fill-blur toggle button element.
   * @returns {HTMLElement}
   * @private
   */
  _getFillBlurButtonElement() {
    return this._els.fillBlurButton.querySelector('.tui-image-editor-button');
  }

  /**
   * Change shape stroke color
   * @param {string} color - fill color
   * @private
   */
  _changeStrokeColorHandler(color) {
    color = color || 'transparent';
    this.options.stroke = color;
    this.actions.changeShape({
      stroke: color,
    });
  }
}

export default Shape;
