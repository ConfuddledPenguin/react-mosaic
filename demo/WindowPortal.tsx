import React from 'react';
import ReactDOM from 'react-dom';

function copyStyles(sourceDoc: Document, targetDoc: Document) {
    [].slice.call(sourceDoc.styleSheets).forEach((ss: StyleSheet) => {
        const styleSheet: CSSStyleSheet = ss as CSSStyleSheet;

        if (styleSheet.cssRules) { // true for inline styles
            const newStyleEl = sourceDoc.createElement('style');

            [].slice.call(styleSheet.cssRules).forEach((cssRule: CSSRule) => {
                newStyleEl.appendChild(sourceDoc.createTextNode(cssRule.cssText));
            });

            targetDoc.head!.appendChild(newStyleEl);
        } else if (styleSheet.href) { // true for stylesheets loaded from a URL
            const newLinkEl = sourceDoc.createElement('link');

            newLinkEl.rel = 'stylesheet';
            newLinkEl.href = styleSheet.href;
            targetDoc.head!.appendChild(newLinkEl);
        }
    });
}

export interface WindowPortalState {
    externalWindow: Window | null
}

export default class WindowPortal extends React.PureComponent<{}, WindowPortalState> {
    private externalWindow: Window | null = null;
    private containerEl: Element = document.createElement('div');

    constructor(props: Readonly<any>) {
        super(props);
        this.state = {
            externalWindow: null
        }
    }

    // Open external window when component mounts
    componentDidMount() {
        this.externalWindow = window.open('', '', `width=${screen.width},height=${screen.height}`);

        if (!this.externalWindow) {
            throw new Error("Unable to open new window");
        }

        this.externalWindow.document.body.appendChild(this.containerEl);
        this.externalWindow.document.title = 'A React portal window';

        //TODO will need to run this when ever CSS is loaded into the document....
        copyStyles(document, this.externalWindow.document);

        //listen for the main window being closed
        window.addEventListener("beforeunload", (e) => {
            this.closeExternalWindow();
        }, false);

        //listen for the external window being closed
        this.externalWindow.addEventListener('beforeunload', () => {
            // this.props.closeWindowPortal(); TODO
        });

        this.setState({externalWindow: this.externalWindow});
    }

    componentWillUnmount() {
        this.closeExternalWindow();
    }

    private closeExternalWindow() : void {
        if (this.externalWindow) {
            this.externalWindow.close();
        }
    }

    render() {
        if (!this.state.externalWindow) {
            return null;
        }
        return ReactDOM.createPortal(this.props.children, this.containerEl);
    }
}
