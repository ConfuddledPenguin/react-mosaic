/**
 * @license
 * Copyright 2016 Palantir Technologies, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Classes, HTMLSelect } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import classNames from 'classnames';
import dropRight from 'lodash/dropRight';
import React from 'react';

import {
  Corner,
  createBalancedTreeFromLeaves,
  getLeaves,
  getNodeAtPath,
  getOtherDirection,
  getPathToCorner,
  Mosaic,
  MosaicDirection,
  MosaicNode,
  MosaicParent,
  MosaicWindow,
  MosaicZeroState,
  updateTree,
} from '../src';

import { CloseAdditionalControlsButton } from './CloseAdditionalControlsButton';
import WindowPortal from './windowPortal';
import MosaicDragDropManagerContext from './MosaicDragDropManagerContext';

import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';
import '../styles/index.less';
import './example.less';

// tslint:disable-next-line no-var-requires
const gitHubLogo = require('./GitHub-Mark-Light-32px.png');
// tslint:disable-next-line no-var-requires
const { version } = require('../package.json');

let windowCount = 3;

export const THEMES = {
  ['Blueprint']: 'mosaic-blueprint-theme',
  ['Blueprint Dark']: classNames('mosaic-blueprint-theme', Classes.DARK),
  ['None']: '',
};

export type Theme = keyof typeof THEMES;

const additionalControls = React.Children.toArray([<CloseAdditionalControlsButton />]);

const EMPTY_ARRAY: any[] = [];

export interface ExampleAppState {
  currentNodes: {
    mainWindow: MosaicNode<number> | null,
    externalWindow: MosaicNode<number> | null,
  },
  currentTheme: Theme;
  externalWindowOpen: boolean,
  mosiacDragDropManagerContext: any
}

const NumberMosaic = Mosaic.ofType<number>();
const NumberMosaicWindow = MosaicWindow.ofType<number>();

export class ExampleApp extends React.PureComponent<{}, ExampleAppState> {
  state: ExampleAppState = {
    currentNodes: {
      mainWindow: {
        direction: 'row',
        first: 1,
        second: {
          direction: 'column',
          first: 2,
          second: 3,
        },
        splitPercentage: 40,
      },
      externalWindow: {
        direction: 'row',
        first: 1,
        second: {
          direction: 'column',
          first: 2,
          second: 3,
        },
        splitPercentage: 40, 
      }
    },
    currentTheme: 'Blueprint',
    externalWindowOpen: false,
    mosiacDragDropManagerContext: null
  };
  private mainWindowMosaicRef: any = React.createRef();

  componentDidMount() {
    const mosaic = this.mainWindowMosaicRef.current;
    const mosiacDragDropManagerContext: any = mosaic.getManager();
    this.setState({mosiacDragDropManagerContext});
  }

  render() {
    return (
      <MosaicDragDropManagerContext.Provider value={this.state.mosiacDragDropManagerContext}>
        <div className="react-mosaic-example-app">
          {this.renderNavBar()}
          <NumberMosaic
            ref={this.mainWindowMosaicRef}
            renderTile={(count, path) => (
              <NumberMosaicWindow
                additionalControls={count === 3 ? additionalControls : EMPTY_ARRAY}
                title={`Window ${count}`}
                createNode={this.createNode}
                path={path}
              >
                <div className="example-window">
                  <h1>{`Window ${count}`}</h1>
                </div>
              </NumberMosaicWindow>
            )}
            zeroStateView={<MosaicZeroState createNode={this.createNode} />}
            value={this.state.currentNodes.mainWindow}
            onChange={this.onMainWindowChange}
            className={THEMES[this.state.currentTheme]}
          />
          {
            this.state.externalWindowOpen &&
            <WindowPortal>
              <NumberMosaic
                renderTile={(count, path) => (
                  <NumberMosaicWindow
                    additionalControls={count === 3 ? additionalControls : EMPTY_ARRAY}
                    title={`Window ${count}`}
                    createNode={this.createNode}
                    path={path}
                  >
                    <div className="example-window">
                      <h1>{`Window ${count}`}</h1>
                    </div>
                  </NumberMosaicWindow>
                )}
                zeroStateView={<MosaicZeroState createNode={this.createNode} />}
                value={this.state.currentNodes.externalWindow}
                onChange={this.onExternalWindowChange}
                className={THEMES[this.state.currentTheme]}
              />
            </WindowPortal>
          }
        </div>
      </MosaicDragDropManagerContext.Provider>
    );
  }

  private onMainWindowChange = (currentNode: MosaicNode<number> | null) => {
    const currentNodes = {...this.state.currentNodes, mainWindow: currentNode};
    this.setState({currentNodes});
  }

  private onExternalWindowChange = (currentNode: MosaicNode<number> | null) => {
    const currentNodes = {...this.state.currentNodes, externalWindow: currentNode};
    this.setState({currentNodes});
  }

  private createNode = () => ++windowCount;

  private autoArrange = () => {
    const leaves = getLeaves(this.state.currentNodes.mainWindow);

    const currentNodes = {...this.state.currentNodes, mainWindow: createBalancedTreeFromLeaves(leaves)};
    this.setState({currentNodes});
  };

  private openInNewWindow = () => {
    this.setState({externalWindowOpen: true});
  };

  private addToTopRight = () => {
    let currentNode = this.state.currentNodes.mainWindow;
    if (currentNode) {
      const path = getPathToCorner(currentNode, Corner.TOP_RIGHT);
      const parent = getNodeAtPath(currentNode, dropRight(path)) as MosaicParent<number>;
      const destination = getNodeAtPath(currentNode, path) as MosaicNode<number>;
      const direction: MosaicDirection = parent ? getOtherDirection(parent.direction) : 'row';

      let first: MosaicNode<number>;
      let second: MosaicNode<number>;
      if (direction === 'row') {
        first = destination;
        second = ++windowCount;
      } else {
        first = ++windowCount;
        second = destination;
      }

      currentNode = updateTree(currentNode, [
        {
          path,
          spec: {
            $set: {
              direction,
              first,
              second,
            },
          },
        },
      ]);
    } else {
      currentNode = ++windowCount;
    }

    const currentNodes = {...this.state.currentNodes, mainWindow: currentNode};
    this.setState({ currentNodes });
  };

  private renderNavBar() {
    return (
      <div className={classNames(Classes.NAVBAR, Classes.DARK)}>
        <div className={Classes.NAVBAR_GROUP}>
          <div className="pt-logo" />
          <div className={Classes.NAVBAR_HEADING}>
            <a href="https://github.com/palantir/react-mosaic">
              react-mosaic <span className="version">v{version}</span>
            </a>
          </div>
        </div>
        <div className={classNames(Classes.NAVBAR_GROUP, Classes.BUTTON_GROUP)}>
          <label className={classNames('theme-selection', Classes.LABEL, Classes.INLINE)}>
            Theme:
            <HTMLSelect
              value={this.state.currentTheme}
              onChange={(e) => this.setState({ currentTheme: e.currentTarget.value as Theme })}
            >
              {React.Children.toArray(Object.keys(THEMES).map((label) => <option>{label}</option>))}
            </HTMLSelect>
          </label>
          <div className="navbar-separator" />
          <span className="actions-label">Example Actions:</span>
          <button
            className={classNames(Classes.BUTTON, Classes.iconClass(IconNames.GRID_VIEW))}
            onClick={this.autoArrange}
          >
            Auto Arrange
          </button>
          <button
            className={classNames(Classes.BUTTON, Classes.iconClass(IconNames.ARROW_TOP_RIGHT))}
            onClick={this.addToTopRight}
          >
            Add Window to Top Right
          </button>
          <button
            className={classNames(Classes.BUTTON, Classes.iconClass(IconNames.APPLICATIONS))}
            onClick={this.openInNewWindow}
          >
            Open in new window (A React Portal)
          </button>
          <a className="github-link" href="https://github.com/palantir/react-mosaic">
            <img src={gitHubLogo} />
          </a>
        </div>
      </div>
    );
  }
}
