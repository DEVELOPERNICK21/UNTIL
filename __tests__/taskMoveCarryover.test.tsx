import React from 'react';
import { Alert, Modal, Platform, TouchableOpacity } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

import { DailyTasksScreen } from '../src/surfaces/app/DailyTasksScreen';

const mockMoveTasks = jest.fn();
const mockSyncDailyTasksWidget = jest.fn();
const mockCloseCarryoverPrompt = jest.fn();
const mockDismissCarryoverNotNow = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
  useFocusEffect: jest.fn(),
}));

jest.mock('../src/hooks', () => ({
  useTodayIso: () => '2026-09-09',
  useDailyTasks: () => ({
    tasks: [],
    stats: { total: 0, completed: 0, pending: 0 },
    refresh: jest.fn(),
    addTask: jest.fn(),
    toggleTask: jest.fn(),
    updateTask: jest.fn(),
    removeTask: jest.fn(),
    moveTasks: mockMoveTasks,
    removeTasks: jest.fn(),
    getGoalTitle: jest.fn(),
  }),
  useTaskCarryoverPrompt: () => ({
    visible: true,
    unfinishedYesterday: [
      {
        id: 'yesterday-1',
        date: '2026-09-08',
        title: 'Open task',
        category: 'other',
        completed: false,
      },
    ],
    closePrompt: mockCloseCarryoverPrompt,
    dismissNotNow: mockDismissCarryoverNotNow,
    clearYesterday: jest.fn(),
  }),
  useWidgetSyncActions: () => ({
    syncDailyTasksWidget: mockSyncDailyTasksWidget,
  }),
}));

jest.mock('../src/ui', () => {
  const ReactModule = require('react');
  const { View, Text: NativeText } = require('react-native');

  return {
    Text: ({ children }: { children?: React.ReactNode }) =>
      ReactModule.createElement(NativeText, null, children),
    ScreenGradient: ({ children }: { children?: React.ReactNode }) =>
      ReactModule.createElement(View, null, children),
    Card: ({ children }: { children?: React.ReactNode }) =>
      ReactModule.createElement(View, null, children),
    ProgressLine: () => null,
  };
});

jest.mock('../src/theme', () => ({
  Spacing: { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20 },
  Colors: {
    accent: '#fff',
    background: '#000',
    cardLighter: '#111',
    divider: '#222',
    textPrimary: '#fff',
    textSecondary: '#999',
  },
  Radius: { sm: 4, md: 8, lg: 12, full: 999 },
  Typography: { greeting: 16, lead: 14, subtitle: 14 },
  FontFamily: { bold: 'System' },
}));

jest.mock('../src/components/engagement/EmberLocalDock', () => ({
  EmberLocalDock: () => null,
}));

jest.mock('../src/components/tasks/TaskMoveSheet', () => {
  const ReactModule = require('react');

  return {
    TaskMoveSheet: (props: object) =>
      ReactModule.createElement('TaskMoveSheet', {
        ...props,
        testID: 'task-move-sheet',
      }),
  };
});

jest.mock('../src/services/emberSurface', () => ({
  setEmberModalCoveringSource: jest.fn(),
}));

describe('DailyTasksScreen carryover move sheet', () => {
  const originalPlatform = Platform.OS;

  beforeAll(() => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'android',
    });
  });

  afterAll(() => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: originalPlatform,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockMoveTasks.mockReturnValue(1);
  });

  async function flushDeferredOpen() {
    await ReactTestRenderer.act(async () => {
      await new Promise<void>(resolve => setTimeout(resolve, 0));
    });
  }

  it('opens the move sheet after closing carryover on Android and moves selected tasks', async () => {
    let renderer!: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<DailyTasksScreen />);
    });

    const pickDateButton = renderer.root
      .findAllByType(TouchableOpacity)
      .find(
        button =>
          button.findAll(node => node.children.includes('Pick a date')).length >
          0,
      );

    expect(pickDateButton).toBeDefined();

    await ReactTestRenderer.act(async () => {
      pickDateButton!.props.onPress();
    });
    await flushDeferredOpen();

    expect(mockCloseCarryoverPrompt).toHaveBeenCalledTimes(1);
    const carryoverModal = renderer.root
      .findAllByType(Modal)
      .find(modal => modal.props.visible === true);
    expect(carryoverModal!.props.onDismiss).toBeUndefined();

    const moveSheet = renderer.root.find(
      node => node.props.testID === 'task-move-sheet',
    );
    expect(moveSheet.props.visible).toBe(true);

    await ReactTestRenderer.act(async () => {
      moveSheet.props.onSelectDate('2026-09-12');
    });

    expect(mockMoveTasks).toHaveBeenCalledWith(['yesterday-1'], '2026-09-12');
    expect(mockSyncDailyTasksWidget).toHaveBeenCalledTimes(1);
    expect(mockDismissCarryoverNotNow).toHaveBeenCalledTimes(1);
  });

  it('marks carryover handled when all moves are duplicate no-ops', async () => {
    mockMoveTasks.mockReturnValue(0);
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation();
    let renderer!: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<DailyTasksScreen />);
    });

    const todayButton = renderer.root
      .findAllByType(TouchableOpacity)
      .find(
        button =>
          button.findAll(node => node.children.includes('Today')).length > 0,
      );

    await ReactTestRenderer.act(async () => {
      todayButton!.props.onPress();
    });

    expect(mockDismissCarryoverNotNow).toHaveBeenCalledTimes(1);
    expect(alertSpy).toHaveBeenCalledWith(
      'Tasks already moved',
      'These tasks are already on that day.',
    );
  });
});
