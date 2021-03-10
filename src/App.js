import React, {Component} from 'react';
import {
  StyleSheet,
  StatusBar,
  Platform,
  PermissionsAndroid,
  View,
  ToastAndroid,
  Linking,
  Alert,
  Switch,
  ScrollView,
  Text,
  Button,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
// import MapView from './MapView';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      forceLocation: true,
      highAccuracy: true,
      loading: false,
      showLocationDialog: true,
      significantChanges: false,
      updatesEnabled: true,
      foregroundService: false,
      location: {},
      // Testing
      permissions: false,
    };
  }

  componentDidMount() {
    this.getLocation();
  }

  componentWillUnmount() {
    this.removeLocationUpdates();
  }

  /************************************ PERMISSIONS ************************************/

  hasLocationPermissionIOS = async () => {
    const openSetting = () => {
      Linking.openSettings().catch(() => {
        Alert.alert('Unable to open settings');
      });
    };
    const status = await Geolocation.requestAuthorization('whenInUse');

    if (status === 'granted') {
      this.setState({permissions: true});
      return true;
    }

    if (status === 'denied') {
      Alert.alert('Location permission denied');
    }

    if (status === 'disabled') {
      Alert.alert(
        `Turn on Location Services to allow "Geolocation App" to determine your location.`,
        '',
        [
          {text: 'Go to Settings', onPress: openSetting},
          {text: "Don't Use Location", onPress: () => {}},
        ],
      );
    }

    return false;
  };

  hasLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      const hasPermission = await this.hasLocationPermissionIOS();
      return hasPermission;
    }

    if (Platform.OS === 'android' && Platform.Version < 23) {
      return true;
    }

    const hasPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );

    if (hasPermission) {
      return true;
    }

    const status = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );

    if (status === PermissionsAndroid.RESULTS.GRANTED) {
      return true;
    }

    if (status === PermissionsAndroid.RESULTS.DENIED) {
      ToastAndroid.show(
        'Location permission denied by user.',
        ToastAndroid.LONG,
      );
    } else if (status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      ToastAndroid.show(
        'Location permission revoked by user.',
        ToastAndroid.LONG,
      );
    }

    return false;
  };

  /************************************ GEOLOCATION CALLS ************************************/

  getLocation = async () => {
    const hasLocationPermission = await this.hasLocationPermission();

    if (!hasLocationPermission) {
      return;
    }

    this.setState({loading: true}, () => {
      Geolocation.getCurrentPosition(
        (position) => {
          this.setState({location: position, loading: false});
          console.log(' getLocation_POSITION: ', position);
        },
        (error) => {
          this.setState({loading: false});
          Alert.alert(`Code ${error.code}`, error.message);
          console.log('getLocation_POSITION: ', error);
        },
        {
          accuracy: {
            android: 'high',
            ios: 'best',
          },
          enableHighAccuracy: this.state.highAccuracy,
          timeout: 15000,
          maximumAge: 10000,
          distanceFilter: 0,
          forceRequestLocation: this.state.forceLocation,
          showLocationDialog: this.state.showLocationDialog,
        },
      );
    });
  };

  getLocationUpdates = async () => {
    const hasLocationPermission = await this.hasLocationPermission();

    if (!hasLocationPermission) {
      return;
    }

    if (Platform.OS === 'android' && this.state.foregroundService) {
      await this.startForegroundService();
    }

    this.setState({updatesEnabled: true}, () => {
      this.watchId = Geolocation.watchPosition(
        (position) => {
          this.setState({location: position});
          console.log(' getLocationUpdates_POSITION: ', position);
        },
        (error) => {
          console.log('getLocationUpdates_POSITION:', error);
        },
        {
          accuracy: {
            android: 'high',
            ios: 'best',
          },
          enableHighAccuracy: this.state.highAccuracy,
          distanceFilter: 0,
          interval: 5000,
          fastestInterval: 2000,
          forceRequestLocation: this.state.forceLocation,
          showLocationDialog: this.state.showLocationDialog,
          useSignificantChanges: this.state.significantChanges,
        },
      );
    });
  };
  removeLocationUpdates = () => {
    if (this.watchId !== null) {
      this.stopForegroundService();
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.setState({updatesEnabled: false});
    }
  };

  startForegroundService = async () => {
    if (Platform.Version >= 26) {
      await VIForegroundService.createNotificationChannel({
        id: 'locationChannel',
        name: 'Location Tracking Channel',
        description: 'Tracks location of user',
        enableVibration: false,
      });
    }

    return VIForegroundService.startService({
      channelId: 'locationChannel',
      id: 420,
      title: appConfig.displayName,
      text: 'Tracking location updates',
      icon: 'ic_launcher',
    });
  };
  stopForegroundService = () => {
    if (this.state.foregroundService) {
      VIForegroundService.stopService().catch((err) => err);
    }
  };

  /************************************ GEOLOCATION CONTROLS ************************************/

  setAccuracy = (value) => this.setState({highAccuracy: value});
  setSignificantChange = (value) => this.setState({significantChanges: value});
  setLocationDialog = (value) => this.setState({showLocationDialog: value});
  setForceLocation = (value) => this.setState({forceLocation: value});
  setForegroundService = (value) => this.setState({foregroundService: value});

  /************************************ RENDERS ************************************/

  render() {
    let {
      permissions,
      forceLocation,
      highAccuracy,
      loading,
      location,
      showLocationDialog,
      significantChanges,
      updatesEnabled,
      foregroundService,
    } = this.state;

    return (
      <View style={styles.container}>
        <StatusBar hidden={true} />
        {/* <MapView coords={location.coords || null} /> */}

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}>
          <View>
            <View style={styles.option}>
              <Text>Enable High Accuracy</Text>
              <Switch onValueChange={this.setAccuracy} value={highAccuracy} />
            </View>

            {Platform.OS === 'ios' && (
              <View style={styles.option}>
                <Text>Use Significant Changes</Text>
                <Switch
                  onValueChange={this.setSignificantChange}
                  value={significantChanges}
                />
              </View>
            )}

            {Platform.OS === 'android' && (
              <>
                <View style={styles.option}>
                  <Text>Show Location Dialog</Text>
                  <Switch
                    onValueChange={this.setLocationDialog}
                    value={showLocationDialog}
                  />
                </View>
                <View style={styles.option}>
                  <Text>Force Location Request</Text>
                  <Switch
                    onValueChange={this.setForceLocation}
                    value={forceLocation}
                  />
                </View>
                <View style={styles.option}>
                  <Text>Enable Foreground Service</Text>
                  <Switch
                    onValueChange={this.setForegroundService}
                    value={foregroundService}
                  />
                </View>
              </>
            )}
          </View>
          <View style={styles.buttonContainer}>
            <Button
              title="Get Location"
              onPress={this.getLocation}
              disabled={loading || updatesEnabled}
            />
            <View style={styles.buttons}>
              <Button
                title="Start Observing"
                onPress={this.getLocationUpdates}
                disabled={updatesEnabled}
              />
              <Button
                title="Stop Observing"
                onPress={this.removeLocationUpdates}
                disabled={!updatesEnabled}
              />
            </View>
          </View>
          <View style={styles.result}>
            <Text>Latitude: {location?.coords?.latitude || ''}</Text>
            <Text>Longitude: {location?.coords?.longitude || ''}</Text>
            <Text>Heading: {location?.coords?.heading}</Text>
            <Text>Accuracy: {location?.coords?.accuracy}</Text>
            <Text>Altitude: {location?.coords?.altitude}</Text>
            <Text>Speed: {location?.coords?.speed}</Text>
            <Text>
              Timestamp:{' '}
              {location.timestamp
                ? new Date(location.timestamp).toLocaleString()
                : ''}
            </Text>
            <Text>
              Has Geolocation Permissions: {permissions ? 'True' : 'False'}
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
  contentContainer: {
    padding: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  result: {
    borderWidth: 1,
    borderColor: '#666',
    width: '100%',
    padding: 10,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 12,
    width: '100%',
  },
});
