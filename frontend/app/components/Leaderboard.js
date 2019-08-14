
import { h, Component } from 'preact';
import Koji from 'koji-tools';

class Leaderboard extends Component {
  state = {
    scores: [],
    dataIsLoaded: false,
    error: false,
  };

  style = {
    container: {
      backgroundColor: Koji.config.colors.backgroundColor,
      color: Koji.config.colors.textColor,
      fontFamily: Koji.config.settings.fontFamily
    },
    row: {
      backgroundColor: Koji.config.colors.primaryColor,
    }
  }

  componentDidMount() {
    fetch(`${Koji.config.serviceMap.backend}/leaderboard`)
      .then((response) => response.json())
      .then(({ scores }) => {
        this.setState({ dataIsLoaded: true, scores });
      })
      .catch(err => {
        console.log('Fetch Error: ', err);
        this.setState({ error: true });
      });
  }

  render() {
    if (this.state.error) {
      return (
        <div id={'leaderboard'} style={this.style.container}>
          <div className={'leaderboard-loading'}>
            <div>{'Error!'}</div>
            <button onClick={() => window.setAppView('game')}>
              {'Back to Game'}
            </button>
          </div>
        </div>
      );
    }

    if (!this.state.dataIsLoaded) {
      return (
        <div id={'leaderboard'} style={this.style.container}>
          <div className={'leaderboard-loading'}>
            <div style='display: flex; margin-top: 20vh; justify-content: center; text-align: center; animation-name: logo; animation-duration: 2s; animation-iteration-count: infinite; animation-timing-function: ease-out;'>
            <div class='lds-ring'><div></div><div></div><div></div><div></div></div>
	        </div>
          </div>
        </div>
      );
    }

    return (
      <div id={'leaderboard'} style={this.style.container}>
        <div className={'leaderboard-container'}>
          <div class={'leaderboard-title'}>
          <div class={'leaderboard-title-text'}>
            Top Scores
          </div>
            <div
              class={'leaderboard-close-button'}
              onClick={() => { window.setAppView('game'); }}
            >
              Close
            </div>
          </div>
          <div className={'leaderboard-contents'}>
            {
              this.state.scores.map((score, index) => (
                <div
                  className={'score-row'}
                  key={index}
                  style={this.style.row}
                >
                  <div className={'name'}>
                    {`${index + 1}. ${score.name}`}
                  </div>
                  <div className={'score'}>
                    {score.score}
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    );
  }
}

export default Leaderboard;

