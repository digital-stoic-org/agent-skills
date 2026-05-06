#!/bin/bash
# Cleanup temporary directories
# Usage: cleanup.sh

LOCAL_TMP="${LOCAL_TMP:-${PWD}/.tmp}"

if [ -d "$LOCAL_TMP" ]; then
  echo "Cleaning up $LOCAL_TMP..."
  rm -rf "$LOCAL_TMP"
  echo "CLEANED:$LOCAL_TMP"
else
  echo "NOTHING_TO_CLEAN"
fi
