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
  ScrollView,
  Text,
  Button,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      updatesEnabled: true,
      location: {},
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
    let openSetting = () => {
      Linking.openSettings().catch(() => {
        Alert.alert('Unable to open settings');
      });
    };
    let status = await Geolocation.requestAuthorization('whenInUse');
    if (status === 'granted') return true;
    if (status === 'denied') Alert.alert('Location permission denied');
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
      let hasPermission = await this.hasLocationPermissionIOS();
      return hasPermission;
    }

    let is_android = Platform.OS === 'android';
    if (is_android && Platform.Version < 23) return true;
    let android_pem = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
    let hasPermission = await PermissionsAndroid.check(android_pem);
    if (hasPermission) return true;
    let status = await PermissionsAndroid.request(android_pem);
    if (status === PermissionsAndroid.RESULTS.GRANTED) return true;
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
    let hasLocationPermission = await this.hasLocationPermission();
    if (!hasLocationPermission) return;

    this.setState({loading: true}, () => {
      Geolocation.getCurrentPosition(
        position => {
          this.setState({location: position, loading: false});
          console.log(' getLocation_POSITION: ', position);
        },
        error => {
          this.setState({loading: false});
          Alert.alert(`Code ${error.code}`, error.message);
          console.log('getLocation_POSITION: ', error);
        },
        {
          accuracy: {
            android: 'high',
            ios: 'best',
          },
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
          distanceFilter: 0,
          forceRequestLocation: true,
          showLocationDialog: true,
        },
      );
    });
  };

  getLocationUpdates = async () => {
    let hasLocationPermission = await this.hasLocationPermission();
    if (!hasLocationPermission) return;

    this.setState({updatesEnabled: true}, () => {
      this.watchId = Geolocation.watchPosition(
        position => {
          this.setState({location: position});
          console.log(' GetGeoUpdates_POSITION: ', position);
        },
        error => console.log('GetGeoUpdates_POSITION:', error),
        {
          accuracy: {android: 'high', ios: 'best'},
          enableHighAccuracy: true,
          distanceFilter: 0,
          interval: 5000,
          fastestInterval: 2000,
          forceRequestLocation: true,
          showLocationDialog: true,
          useSignificantChanges: false,
        },
      );
    });
  };
  removeLocationUpdates = () => {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.setState({updatesEnabled: false});
    }
  };

  /************************************ RENDERS ************************************/

  renderBtnControls = () => {
    let {updatesEnabled} = this.state;

    return (
      <View style={styles.buttons_container}>
        {!updatesEnabled ? (
          <>
            <TouchableOpacity
              onPress={this.getLocation}
              style={styles.btn_left_container}>
              <Text style={styles.txt_black}>Get</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={this.getLocationUpdates}
              style={styles.btn_right_container}>
              <Text style={styles.txt_black}>Start Watching</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            onPress={this.removeLocationUpdates}
            style={styles.btn_full_container}>
            <Text style={styles.txt_black}>Stop Watching</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  render() {
    let {location, updatesEnabled} = this.state;

    return (
      <SafeAreaView style={styles.base_container}>
        <View style={styles.container}>
          <StatusBar hidden={true} />

          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content_container}>
            {this.renderBtnControls()}

            <View style={styles.container_line}>
              <Text style={styles.txt_black}>
                Geolocation Watcher: {updatesEnabled ? 'On' : 'Off'}
              </Text>
            </View>

            <View style={styles.empty_container}>
              <Text style={styles.txt_black}>
                Latitude: {location?.coords?.latitude || ''}
              </Text>
            </View>

            <View style={styles.empty_container}>
              <Text style={styles.txt_black}>
                Longitude: {location?.coords?.longitude || ''}
              </Text>
            </View>

            <View style={styles.empty_container}>
              <Text style={styles.txt_black}>
                Heading: {location?.coords?.heading}
              </Text>
            </View>

            <View style={styles.empty_container}>
              <Text style={styles.txt_black}>
                Accuracy: {location?.coords?.accuracy}
              </Text>
            </View>

            <View style={styles.empty_container}>
              <Text style={styles.txt_black}>
                Altitude: {location?.coords?.altitude}
              </Text>
            </View>

            <View style={styles.empty_container}>
              <Text style={styles.txt_black}>
                Speed: {location?.coords?.speed}
              </Text>
            </View>

            <View style={styles.empty_container}>
              <Text style={styles.txt_black}>
                Timestamp:{' '}
                {location.timestamp
                  ? new Date(location.timestamp).toLocaleString()
                  : ''}
              </Text>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  base_container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
  content_container: {
    padding: 15,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  border_container: {
    borderWidth: 1,
    borderColor: '#666',
    width: '100%',
    padding: 12,
  },
  container_line: {
    width: '100%',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#666',
  },
  empty_container: {
    width: '100%',
    padding: 12,
  },
  buttons_container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  btn_left_container: {
    flex: 1,
    borderWidth: 1,
    padding: 12,
    borderColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btn_right_container: {
    flex: 1,
    borderWidth: 1,
    padding: 12,
    borderColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  btn_full_container: {
    flex: 1,
    borderWidth: 1,
    padding: 12,
    borderColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
  },
  txt_black: {
    color: '#000000',
  },
});
