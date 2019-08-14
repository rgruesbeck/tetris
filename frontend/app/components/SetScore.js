
import { h, Component } from 'preact';
import PropTypes from 'prop-types';
import Koji from 'koji-tools';

class SetScore extends Component {
	static propTypes = {
		score: PropTypes.number,
	};

	state = {
		// email: '',
		name: '',
		isSubmitting: false,
	};

	style = {
		container: {
			height: '100vh',
			width: '100vw',
			backgroundColor: Koji.config.colors.backgroundColor,
			fontFamily: Koji.config.settings.fontFamily
		},
		form: {
			backgroundColor: Koji.config.colors.secondaryColor,
			borderColor: Koji.config.colors.Color
		},
		input: {
			color: Koji.config.colors.darkTextColor
		},
		button: {
			color: Koji.config.colors.textColor,
			backgroundColor: Koji.config.colors.primaryColor
		}
	}

	componentDidMount() {
		//Activated with a delay so it doesn't lose focus immediately after click
		setTimeout(function(){
			this.nameInput.focus();
		}.bind(this), 100);
		
	}

	handleClose = () => {
		window.setAppView('game');
	}

	handleSubmit = (e) => {
		e.preventDefault();

		if (this.state.name != '') {
			this.setState({ isSubmitting: true });

			const body = {
				name: this.state.name,
				score: this.props.score,
				// privateAttributes: {
				//    email: this.state.email,
				// },
			};

			fetch(`${Koji.config.serviceMap.backend}/leaderboard/save`, {
				method: 'post',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(body),
			})
				.then((response) => response.json())
				.then((jsonResponse) => {
					// console.log(jsonResponse);

					window.setAppView('leaderboard');
				})
				.catch(err => {
					console.log(err);
				});

		}
	}

	render() {
		return (
			<div style={this.style.container}>
				<div className='title' style={{ color: Koji.config.colors.textColor }}>
					Submit Score
				</div>

				<div id={'leaderboard-set-score'} style={this.style.form}>
					<form
						id={'score-form'}
						onSubmit={this.handleSubmit}
					>
						<div className={'input-wrapper'}>
							<label className={'label'} style={this.style.label}>
								Score
							</label>
							<input
								disabled
								value={this.props.score}
								style={this.style.input}
							/>
						</div>

						<div className={'input-wrapper'}>
							<label className={'label'} style={this.style.label}>
								Name
							</label>
							<input
								onChange={(event) => {
									this.setState({ name: event.target.value });
								}}
								type={'text'}
								value={this.state.name}
								style={this.style.input}
								ref={(input) => { this.nameInput = input; }}
							/>
						</div>

						{/*
						<div className={'input-wrapper'}>
							<label>{'Your Email Address (Private)'}</label>
							<input
							onChange={(event) => {
								this.setState({ email: event.target.value });
							}}
							type={'email'}
							value={this.state.email}
							/>
						</div>
						*/}

						<button
							disabled={this.state.isSubmitting}
							onClick={this.handleSubmit}
							type={'submit'}
							style={this.style.button}
						>
							Submit
						</button>
					</form>

					<button className='dismiss-button'
						onClick={this.handleClose}
						style={this.style.button}
					>
						Cancel
					</button>


				</div>
			</div>
		)
	}
}

export default SetScore;

