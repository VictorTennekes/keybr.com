import { keyboardProps } from "@keybr/keyboard";
import { addKey, deleteKey } from "@keybr/keyboard-ui";
import { Screen } from "@keybr/pages-shared";
import { enumProp, useSettings } from "@keybr/settings";
import { type LineList } from "@keybr/textinput";
import { type KeyEvent, ModifierState } from "@keybr/textinput-events";
import { TextArea } from "@keybr/textinput-ui";
import { PureComponent, type ReactNode } from "react";
import { Prefs } from "../prefs.ts";
import { Announcer } from "./Announcer.tsx";
import { Controls } from "./Controls.tsx";
import { Indicators } from "./Indicators.tsx";
import { DeferredKeyboardPresenter } from "./KeyboardPresenter.tsx";
import * as names from "./names.module.less";
import { type PracticeState } from "./practicestate.ts";
import { PracticeTour } from "./PracticeTour.tsx";
import * as styles from "./Presenter.module.less";

type Props = {
  readonly state: PracticeState;
  readonly lines: LineList;
  readonly onResetLesson: () => void;
  readonly onSkipLesson: () => void;
  readonly onKeyDown: (ev: KeyEvent) => void;
  readonly onKeyUp: (ev: KeyEvent) => void;
  readonly onInput: (codePoint: number, timeStamp: number) => void;
  readonly onConfigure: () => void;
};

type State = {
  readonly view: View;
  readonly tour: boolean;
  readonly focus: boolean;
  readonly depressedKeys: readonly string[];
};

enum View {
  Normal = 1,
  Compact = 2,
  Bare = 3,
}

function getNextView(view: View): View {
  switch (view) {
    case View.Normal:
      return View.Compact;
    case View.Compact:
      return View.Bare;
    case View.Bare:
      return View.Normal;
  }
}

const propView = enumProp("prefs.practice.view", View, View.Normal);

export class Presenter extends PureComponent<Props, State> {
  override state: State = {
    view: Prefs.get(propView),
    tour: false,
    focus: false,
    depressedKeys: [],
  };

  override componentDidMount(): void {
    if (this.props.state.showTour) {
      this.setState({
        view: View.Normal,
        tour: true,
      });
    }
  }

  override render(): ReactNode {
    const {
      props: { state, lines, onConfigure },
      state: { view, tour, focus, depressedKeys },
      handleResetLesson,
      handleSkipLesson,
      handleKeyDown,
      handleKeyUp,
      handleInput,
      handleFocus,
      handleBlur,
      handleChangeView,
      handleHelp,
      handleTourClose,
    } = this;
    switch (view) {
      case View.Normal:
        return (
          <NormalLayout
            state={state}
            focus={focus}
            depressedKeys={depressedKeys}
            toggledKeys={ModifierState.modifiers}
            controls={
              <Controls
                onChangeView={handleChangeView}
                onResetLesson={handleResetLesson}
                onSkipLesson={handleSkipLesson}
                onHelp={handleHelp}
                onConfigure={onConfigure}
              />
            }
            textInput={
              <TextArea
                settings={state.textDisplaySettings}
                lines={lines}
                size="X0"
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                onInput={handleInput}
              />
            }
            tour={tour && <PracticeTour onClose={handleTourClose} />}
          />
        );
      case View.Compact:
        return (
          <CompactLayout
            state={state}
            focus={focus}
            depressedKeys={depressedKeys}
            controls={
              <Controls
                onChangeView={handleChangeView}
                onResetLesson={handleResetLesson}
                onSkipLesson={handleSkipLesson}
                onHelp={handleHelp}
                onConfigure={onConfigure}
              />
            }
            textInput={
              <TextArea
                settings={state.textDisplaySettings}
                lines={lines}
                size="X1"
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                onInput={handleInput}
              />
            }
          />
        );
      case View.Bare:
        return (
          <BareLayout
            state={state}
            focus={focus}
            depressedKeys={depressedKeys}
            controls={
              <Controls
                onChangeView={handleChangeView}
                onResetLesson={handleResetLesson}
                onSkipLesson={handleSkipLesson}
                onHelp={handleHelp}
                onConfigure={onConfigure}
              />
            }
            textInput={
              <TextArea
                settings={state.textDisplaySettings}
                lines={lines}
                size="X2"
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                onInput={handleInput}
              />
            }
          />
        );
    }
  }

  private handleResetLesson = (): void => {
    this.props.onResetLesson();
  };

  private handleSkipLesson = (): void => {
    this.props.onSkipLesson();
  };

  private handleKeyDown = (ev: KeyEvent): void => {
    if (this.state.focus) {
      this.setState(({ depressedKeys }) => ({
        depressedKeys: addKey(depressedKeys, ev.code),
      }));
      this.props.onKeyDown(ev);
    }
  };

  private handleKeyUp = (ev: KeyEvent): void => {
    if (this.state.focus) {
      this.setState(({ depressedKeys }) => ({
        depressedKeys: deleteKey(depressedKeys, ev.code),
      }));
      this.props.onKeyUp(ev);
    }
  };

  private handleInput = (codePoint: number, timeStamp: number): void => {
    if (this.state.focus) {
      this.props.onInput(codePoint, timeStamp);
    }
  };

  private handleFocus = (): void => {
    this.setState(
      {
        focus: true,
        depressedKeys: [],
      },
      () => {
        this.props.onResetLesson();
      },
    );
  };

  private handleBlur = (): void => {
    this.setState(
      {
        focus: false,
        depressedKeys: [],
      },
      () => {
        this.props.onResetLesson();
      },
    );
  };

  private handleChangeView = (): void => {
    this.setState(
      ({ view }) => {
        const nextView = getNextView(view);
        Prefs.set(propView, nextView);
        return { view: nextView };
      },
      () => {
        this.props.onResetLesson();
      },
    );
  };

  private handleHelp = (): void => {
    this.setState(
      {
        view: View.Normal,
        tour: true,
      },
      () => {
        this.props.onResetLesson();
      },
    );
  };

  private handleTourClose = (): void => {
    this.setState(
      {
        view: View.Normal,
        tour: false,
      },
      () => {
        this.props.onResetLesson();
      },
    );
  };
}

function NormalLayout({
  state,
  focus,
  depressedKeys,
  toggledKeys,
  controls,
  textInput,
  tour,
}: {
  readonly state: PracticeState;
  readonly focus: boolean;
  readonly depressedKeys: readonly string[];
  readonly toggledKeys: readonly string[];
  readonly controls: ReactNode;
  readonly textInput: ReactNode;
  readonly tour: ReactNode;
}): ReactNode {
  const { settings } = useSettings();
  return (
    <Screen>
      <Indicators state={state} />
      {controls}
      <div id={names.textInput} className={styles.textInput_normal}>
        {textInput}
      </div>
      <div id={names.keyboard}>
        <DeferredKeyboardPresenter
          focus={focus}
          depressedKeys={depressedKeys}
          toggledKeys={toggledKeys}
          lastLesson={state.lastLesson}
          showColors={settings.get(keyboardProps.colors)}
        />
      </div>
      <Announcer state={state} />
      {tour}
    </Screen>
  );
}

function CompactLayout({
  state,
  controls,
  textInput,
}: {
  readonly state: PracticeState;
  readonly focus: boolean;
  readonly depressedKeys: readonly string[];
  readonly controls: ReactNode;
  readonly textInput: ReactNode;
}): ReactNode {
  return (
    <Screen>
      <Indicators state={state} />
      {controls}
      <div id={names.textInput} className={styles.textInput_compact}>
        {textInput}
      </div>
      <Announcer state={state} />
    </Screen>
  );
}

function BareLayout({
  state,
  controls,
  textInput,
}: {
  readonly state: PracticeState;
  readonly focus: boolean;
  readonly depressedKeys: readonly string[];
  readonly controls: ReactNode;
  readonly textInput: ReactNode;
}): ReactNode {
  return (
    <Screen>
      {controls}
      <div id={names.textInput} className={styles.textInput_bare}>
        {textInput}
      </div>
      <Announcer state={state} />
    </Screen>
  );
}
