import { h, render } from 'preact';
import Koji from 'koji-tools';
import './leaderboardStyles.css';
import './style.css';

window.Koji = Koji;

Koji.pageLoad();

let root;
function init() {
	let App = require('../app/components/App').default;
	root = render(<App />, document.body, root);
}

init();
